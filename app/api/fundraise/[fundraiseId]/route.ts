import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, updateFundraiseSchema, uuidSchema } from '@/lib/validations'

export async function GET(
    request: NextRequest,
    { params }: { params: { fundraiseId: string } }
) {
    try {
        const validatedParams = uuidSchema.parse(params.fundraiseId)

        const fundraise = await prisma.fundraise.findUnique({
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

        if (!fundraise) {
            return NextResponse.json(
                { error: 'Fundraise not found' },
                { status: 404 }
            )
        }

        // Calculate total pledged amount
        const totalPledged = fundraise.pledges.reduce((sum, pledge) => {
            return sum + Number(pledge.totalAmountPledged)
        }, 0)

        // Calculate total paid out
        const totalPaidOut = fundraise.pledges.reduce((sum, pledge) => {
            return sum + Number(pledge.amountPaidOut)
        }, 0)

        return NextResponse.json({
            fundraise: {
                ...fundraise,
                totalPledged,
                totalPaidOut,
                progress: (totalPledged / Number(fundraise.targetAmount)) * 100
            }
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid fundraise ID' },
                { status: 400 }
            )
        }

        console.error('Error fetching fundraise:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { fundraiseId: string } }
) {
    try {
        const validatedParams = uuidSchema.parse(params.fundraiseId)
        const updateData = await validateRequest(updateFundraiseSchema, request)

        // Convert deadline string to Date if provided
        // if (updateData.deadline) {
        //     updateData.deadline = new Date(updateData.deadline)
        // }

        const fundraise = await prisma.fundraise.update({
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
            message: 'Fundraise updated successfully',
            fundraise
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
                { error: 'Fundraise not found' },
                { status: 404 }
            )
        }

        console.error('Error updating fundraise:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { fundraiseId: string } }
) {
    try {
        const validatedParams = uuidSchema.parse(params.fundraiseId)

        // Check if fundraise has any pledges
        const pledgeCount = await prisma.pledge.count({
            where: { fundraiseId: validatedParams }
        })

        if (pledgeCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete fundraise with existing pledges' },
                { status: 400 }
            )
        }

        await prisma.fundraise.delete({
            where: { id: validatedParams }
        })

        return NextResponse.json({
            message: 'Fundraise deleted successfully'
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid fundraise ID' },
                { status: 400 }
            )
        }

        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return NextResponse.json(
                { error: 'Fundraise not found' },
                { status: 404 }
            )
        }

        console.error('Error deleting fundraise:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 