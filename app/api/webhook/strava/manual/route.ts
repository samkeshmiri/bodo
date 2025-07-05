import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createActivitySchema } from '@/lib/validations'
import { escrowService } from '@/lib/escrow'

export async function POST(request: NextRequest) {
    try {
        const body = await validateRequest(createActivitySchema, request)

        // For testing, we'll get fundraiserUserId from the request body
        // In a real app, this would be determined from the Strava user ID
        const { fundraiserUserId } = await request.json()

        if (!fundraiserUserId) {
            return NextResponse.json(
                { error: 'Fundraiser user ID is required' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: fundraiserUserId }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Check if activity already exists
        const existingActivity = await prisma.activity.findFirst({
            where: {
                externalActivityId: body.externalActivityId,
                source: body.source
            }
        })

        if (existingActivity) {
            return NextResponse.json(
                { error: 'Activity already exists', activityId: existingActivity.id },
                { status: 409 }
            )
        }

        // Create activity
        const activity = await prisma.activity.create({
            data: {
                fundraiserUserId,
                distance: body.distance,
                source: body.source,
                externalActivityId: body.externalActivityId,
                activityDate: body.activityDate || new Date().toISOString(),
            }
        })

        console.log(`🏃 Activity created: ${body.distance}km for user ${fundraiserUserId}`)

        // Process payouts
        const payouts = await escrowService.processActivity(activity.id)

        return NextResponse.json(
            {
                message: 'Activity created and payouts processed',
                activity: {
                    id: activity.id,
                    distance: activity.distance,
                    source: activity.source,
                    externalActivityId: activity.externalActivityId,
                    createdAt: activity.createdAt
                },
                payouts: payouts.length > 0 ? payouts : 'No payouts processed'
            },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.message },
                { status: 400 }
            )
        }

        console.error('Error creating activity:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}