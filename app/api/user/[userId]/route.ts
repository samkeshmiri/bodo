import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, updateUserSchema, uuidSchema } from '@/lib/validations'

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        // Validate UUID
        const validatedParams = uuidSchema.parse(params.userId)

        const user = await prisma.user.findUnique({
            where: { id: validatedParams },
            include: {
                wallets: true,
                fundraises: {
                    include: {
                        pledges: {
                            include: {
                                staker: {
                                    select: {
                                        id: true,
                                        privyUserId: true
                                    }
                                }
                            }
                        }
                    }
                },
                pledges: {
                    include: {
                        fundraise: {
                            select: {
                                id: true,
                                title: true,
                                user: {
                                    select: {
                                        id: true,
                                        privyUserId: true
                                    }
                                }
                            }
                        }
                    }
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            user: {
                id: user.id,
                privyUserId: user.privyUserId,
                stravaId: user.stravaId,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                wallets: user.wallets,
                fundraises: user.fundraises,
                pledges: user.pledges,
                recentActivities: user.activities
            }
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            )
        }

        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        // Validate UUID
        const validatedParams = uuidSchema.parse(params.userId)
        const updateData = await validateRequest(updateUserSchema, request)

        // Remove walletAddress from user update fields
        const { walletAddress, ...userUpdateFields } = updateData;

        const user = await prisma.user.update({
            where: { id: validatedParams },
            data: userUpdateFields
        })

        // Upsert wallet if walletAddress is present
        if (walletAddress) {
            await prisma.wallet.upsert({
                where: {
                    userId_provider: {
                        userId: user.id,
                        provider: 'privy'
                    }
                },
                update: {
                    address: walletAddress,
                    status: 'active',
                    provider: 'privy',
                    userId: user.id
                },
                create: {
                    userId: user.id,
                    address: walletAddress,
                    provider: 'privy',
                    status: 'active'
                }
            })
        }

        return NextResponse.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                privyUserId: user.privyUserId,
                stravaId: user.stravaId,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
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
                { error: 'User not found' },
                { status: 404 }
            )
        }

        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 