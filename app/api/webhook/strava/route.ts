import { escrowService } from '@/lib/escrow'
import { prisma } from '@/lib/prisma'
import { getStravaActivities, refreshStravaToken, verifyStravaWebhook } from '@/lib/strava'
import { stravaWebhookSchema } from '@/lib/validations'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Strava sends a GET request to verify the webhook endpoint
        const { searchParams } = new URL(request.url)
        const mode = searchParams.get('hub.mode')
        const token = searchParams.get('hub.verify_token')
        const challenge = searchParams.get('hub.challenge')

        console.log('🔍 Strava webhook verification request:', { mode, token, challenge })

        // Check if this is a webhook verification request
        if (mode === 'subscribe' && token && challenge) {
            const webhookSecret = process.env.STRAVA_WEBHOOK_SECRET

            if (token === webhookSecret) {
                console.log('✅ Webhook verification successful')
                // Return the challenge as JSON, as required by Strava
                return NextResponse.json({ "hub.challenge": challenge }, { status: 200 })
            } else {
                console.error('❌ Invalid verify token')
                return NextResponse.json(
                    { error: 'Invalid verify token' },
                    { status: 403 }
                )
            }
        }

        // If not a verification request, return 404
        return NextResponse.json(
            { error: 'Not found' },
            { status: 404 }
        )

    } catch (error) {
        console.error('❌ Error in webhook verification:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the raw body for signature verification
        const rawBody = await request.text()

        // Verify webhook signature
        const signature = request.headers.get('x-hub-signature')
        if (!signature) {
            console.error('❌ Missing webhook signature')
            return NextResponse.json(
                { error: 'Missing webhook signature' },
                { status: 401 }
            )
        }

        if (!verifyStravaWebhook(rawBody, signature)) {
            console.error('❌ Invalid webhook signature')
            return NextResponse.json(
                { error: 'Invalid webhook signature' },
                { status: 401 }
            )
        }

        // Parse and validate webhook payload
        const validatedData = stravaWebhookSchema.parse(JSON.parse(rawBody))

        console.log('📨 Strava webhook received:', {
            objectType: validatedData.object_type,
            objectId: validatedData.object_id,
            aspectType: validatedData.aspect_type,
            ownerId: validatedData.owner_id
        })

        // Only process activity events
        if (validatedData.object_type !== 'activity') {
            return NextResponse.json(
                { message: 'Ignoring non-activity event' },
                { status: 200 }
            )
        }

        // Only process create/update events
        if (!['create', 'update'].includes(validatedData.aspect_type)) {
            return NextResponse.json(
                { message: 'Ignoring non-create/update event' },
                { status: 200 }
            )
        }

        // Find user by Strava ID
        const user = await prisma.user.findFirst({
            where: { stravaId: validatedData.owner_id.toString() },
            include: {
                wallets: {
                    where: { status: 'active' }
                }
            }
        })

        if (!user) {
            console.log(`❌ User not found for Strava ID: ${validatedData.owner_id}`)
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (!user.stravaAccessToken) {
            console.log(`❌ User ${user.id} has no Strava access token`)
            return NextResponse.json(
                { error: 'User not connected to Strava' },
                { status: 400 }
            )
        }

        // Check if token needs refresh
        let accessToken = user.stravaAccessToken
        if (user.stravaTokenExpiresAt && user.stravaTokenExpiresAt < new Date()) {
            console.log(`🔄 Refreshing Strava token for user ${user.id}`)
            try {
                const tokens = await refreshStravaToken(user.stravaRefreshToken!)
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stravaAccessToken: tokens.access_token,
                        stravaRefreshToken: tokens.refresh_token,
                        stravaTokenExpiresAt: new Date(tokens.expires_at * 1000),
                    }
                })
                accessToken = tokens.access_token
            } catch (error) {
                console.error('❌ Failed to refresh Strava token:', error)
                return NextResponse.json(
                    { error: 'Failed to refresh Strava token' },
                    { status: 500 }
                )
            }
        }

        // Get activity details from Strava
        let activityDetails: any
        try {
            const activities = await getStravaActivities(accessToken)
            activityDetails = activities.find((activity: any) => activity.id === validatedData.object_id)

            if (!activityDetails) {
                console.log(`❌ Activity ${validatedData.object_id} not found in recent activities`)
                return NextResponse.json(
                    { error: 'Activity not found' },
                    { status: 404 }
                )
            }
        } catch (error) {
            console.error('❌ Failed to fetch activity from Strava:', error)
            return NextResponse.json(
                { error: 'Failed to fetch activity from Strava' },
                { status: 500 }
            )
        }

        // Check if activity already exists in our database
        const existingActivity = await prisma.activity.findFirst({
            where: {
                fundraiserUserId: user.id,
                externalActivityId: activityDetails.id.toString(),
            }
        })

        if (existingActivity) {
            console.log(`ℹ️ Activity ${activityDetails.id} already exists in database`)
            return NextResponse.json(
                { message: 'Activity already processed' },
                { status: 200 }
            )
        }

        // Create activity in our database
        const activity = await prisma.activity.create({
            data: {
                fundraiserUserId: user.id,
                distance: activityDetails.distance / 1000, // Convert meters to kilometers
                source: 'strava',
                externalActivityId: activityDetails.id.toString(),
                activityDate: new Date(activityDetails.start_date),
            }
        })

        console.log(`✅ Created activity: ${activity.id} for user ${user.id}`)

        // Find all active pledges for this user's fundraises
        const pledges = await prisma.pledge.findMany({
            where: {
                fundraise: {
                    userId: user.id
                },
                status: 'active',
                escrowConfirmed: true, // Only process pledges that have been escrowed
            },
            include: {
                fundraise: true
            }
        })

        if (pledges.length === 0) {
            console.log(`ℹ️ No active pledges found for user ${user.id}`)
            return NextResponse.json(
                {
                    message: 'Activity created but no active pledges found',
                    activityId: activity.id
                },
                { status: 200 }
            )
        }

        // Calculate and process payouts for each pledge
        const payoutResults = []
        for (const pledge of pledges) {
            try {
                const payoutAmount = Number(pledge.perKmRate) * Number(activity.distance)

                // Check if pledge has enough remaining amount
                if (Number(pledge.amountRemaining) < payoutAmount) {
                    console.log(`⚠️ Pledge ${pledge.id} has insufficient remaining amount`)
                    payoutResults.push({
                        pledgeId: pledge.id,
                        error: 'Insufficient remaining amount',
                        calculatedAmount: payoutAmount,
                        remainingAmount: Number(pledge.amountRemaining)
                    })
                    continue
                }

                // Process the payout
                const txHash = await escrowService.processPayout(
                    pledge.id,
                    activity.id,
                    payoutAmount
                )

                payoutResults.push({
                    pledgeId: pledge.id,
                    txHash,
                    amount: payoutAmount,
                    status: 'success'
                })

                console.log(`💰 Processed payout: ${payoutAmount} for pledge ${pledge.id}`)

            } catch (error) {
                console.error(`❌ Failed to process payout for pledge ${pledge.id}:`, error)
                payoutResults.push({
                    pledgeId: pledge.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 'failed'
                })
            }
        }

        return NextResponse.json({
            message: 'Activity processed successfully',
            activityId: activity.id,
            payouts: payoutResults,
            totalPledges: pledges.length,
            successfulPayouts: payoutResults.filter(r => r.status === 'success').length
        }, { status: 200 })

    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            console.error('❌ Webhook validation failed:', error)
            return NextResponse.json(
                { error: 'Invalid webhook payload' },
                { status: 400 }
            )
        }

        console.error('❌ Error processing Strava webhook:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 