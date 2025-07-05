import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, stravaWebhookSchema, createActivitySchema } from '@/lib/validations'
import { escrowService } from '@/lib/escrow'

export async function POST(request: NextRequest) {
    try {
        const webhookData = await validateRequest(stravaWebhookSchema, request)

        console.log('📡 Strava webhook received:', {
            objectType: webhookData.object_type,
            objectId: webhookData.object_id,
            aspectType: webhookData.aspect_type,
            ownerId: webhookData.owner_id
        })

        // Only process activity events
        if (webhookData.object_type !== 'activity') {
            return NextResponse.json({ message: 'Ignored non-activity event' })
        }

        // Only process create/update events
        if (!['create', 'update'].includes(webhookData.aspect_type)) {
            return NextResponse.json({ message: 'Ignored non-create/update event' })
        }

        // Process the activity
        await processStravaActivity(webhookData)

        return NextResponse.json({
            message: 'Webhook processed successfully',
            activityId: webhookData.object_id
        })
    } catch (error) {
        console.error('❌ Error processing Strava webhook:', error)

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid webhook data' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Helper function to process Strava activity
 */
async function processStravaActivity(webhookData: any) {
    try {
        const activityId = webhookData.object_id
        const ownerId = webhookData.owner_id

        // In a real implementation, you would:
        // 1. Fetch activity details from Strava API using the activity ID
        // 2. Get the user's Strava ID and find the corresponding user in your database
        // 3. Create or update the activity record
        // 4. Process payouts

        // For now, we'll simulate this process
        console.log(`🔄 Processing Strava activity ${activityId} for user ${ownerId}`)

        // Find user by Strava ID
        const user = await prisma.user.findFirst({
            where: {
                stravaId: ownerId.toString()
            }
        })

        if (!user) {
            console.log(`⚠️ No user found for Strava ID: ${ownerId}`)
            return
        }

        // Check if activity already exists
        const existingActivity = await prisma.activity.findFirst({
            where: {
                externalActivityId: activityId.toString(),
                source: 'Strava'
            }
        })

        if (existingActivity) {
            console.log(`⚠️ Activity ${activityId} already processed`)
            return
        }

        // For simulation, we'll create a mock activity
        // In reality, you'd fetch this data from Strava API
        const mockDistance = Math.random() * 20 + 1 // 1-21 km

        const activity = await prisma.activity.create({
            data: {
                fundraiserUserId: user.id,
                distance: mockDistance,
                source: 'Strava',
                externalActivityId: activityId.toString()
            }
        })

        console.log(`🏃 Activity created: ${mockDistance}km for user ${user.id}`)

        // Process payouts
        const payouts = await escrowService.processActivity(activity.id)

        if (payouts.length > 0) {
            console.log(`💰 Processed ${payouts.length} payouts for activity ${activity.id}`)
        } else {
            console.log(`ℹ️ No payouts processed for activity ${activity.id}`)
        }

    } catch (error) {
        console.error('❌ Error processing Strava activity:', error)
        throw error
    }
} 