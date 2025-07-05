import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, updateFundraiseSchema, uuidSchema } from '@/lib/validations'

export async function GET(
    request: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    try {
        const validatedParams = uuidSchema.parse(params.campaignId)

        const campaign = await prisma.fundraise.findUnique({
            where: { id: validatedParams },
            include: {
                user: {
                    select: {
                        id: true,
                        privyUserId: true,
                        status: true
                    }
                },
                pledges: {
                    include: {
                        staker: {
                            select: {
                                id: true,
                                privyUserId: true,
                                status: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!campaign) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            )
        }

        // Calculate total pledged amount
        const totalPledged = campaign.pledges.reduce((sum: number, pledge: any) => {
            return sum + Number(pledge.totalAmountPledged)
        }, 0)

        // Calculate total paid out
        const totalPaidOut = campaign.pledges.reduce((sum: number, pledge: any) => {
            return sum + Number(pledge.amountPaidOut)
        }, 0)

        return NextResponse.json({
            campaign: {
                ...campaign,
                totalPledged,
                totalPaidOut,
                progress: (totalPledged / Number(campaign.targetAmount)) * 100,
                daysRemaining: Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid campaign ID' },
                { status: 400 }
            )
        }

        console.error('Error fetching campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    try {
        const validatedParams = uuidSchema.parse(params.campaignId)
        const updateData = await validateRequest(updateFundraiseSchema, request)

        const campaign = await prisma.fundraise.update({
            where: { id: validatedParams },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        privyUserId: true,
                        status: true
                    }
                }
            }
        })

        return NextResponse.json({
            message: 'Campaign updated successfully',
            campaign
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.message },
                { status: 400 }
            )
        }

        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            )
        }

        console.error('Error updating campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    try {
        const validatedParams = uuidSchema.parse(params.campaignId)

        // Check if campaign has any pledges
        const pledgeCount = await prisma.pledge.count({
            where: { fundraiseId: validatedParams }
        })

        if (pledgeCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete campaign with existing pledges' },
                { status: 400 }
            )
        }

        await prisma.fundraise.delete({
            where: { id: validatedParams }
        })

        return NextResponse.json({
            message: 'Campaign deleted successfully'
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid campaign ID' },
                { status: 400 }
            )
        }

        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json(
                { error: 'Campaign not found' },
                { status: 404 }
            )
        }

        console.error('Error deleting campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 