import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createActivitySchema } from '@/lib/validations'
import { escrowService } from '@/lib/escrow'

export async function POST(request: NextRequest) {
    try {
        const body = await validateRequest(createActivitySchema, request)

        // fundraiserUserId is already validated in the schema
        const { fundraiserUserId } = body

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
                fundraiserUserId: body.fundraiserUserId,
                distance: body.distance,
                source: body.source,
                externalActivityId: body.externalActivityId,
                activityDate: body.activityDate,
            }
        })

        console.log(`🏃 Activity created: ${body.distance}km for user ${body.fundraiserUserId}`)

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