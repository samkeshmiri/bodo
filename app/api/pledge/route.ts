import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createPledgeSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const fundraiseId = searchParams.get('fundraiseId')
        const stakerUserId = searchParams.get('stakerUserId')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}
        if (status) where.status = status
        if (fundraiseId) where.fundraiseId = fundraiseId
        if (stakerUserId) where.stakerUserId = stakerUserId

        const [pledges, total] = await Promise.all([
            prisma.pledge.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
                    },
                    staker: {
                        select: {
                            id: true,
                            privyUserId: true
                        }
                    }
                }
            }),
            prisma.pledge.count({ where })
        ])

        return NextResponse.json({
            pledges,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching pledges:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Only call request.json() once
        const rawBody = await request.json();
        const body = createPledgeSchema.parse(rawBody);

        const { stakerUserId, stakerWalletAddress } = body;

        // Validate that we have either stakerUserId (authenticated) or stakerWalletAddress (anonymous)
        if (!stakerUserId && !stakerWalletAddress) {
            return NextResponse.json(
                { error: 'Either stakerUserId (authenticated) or stakerWalletAddress (anonymous) is required' },
                { status: 400 }
            )
        }

        // Check if fundraise exists and is active
        const fundraise = await prisma.fundraise.findUnique({
            where: { id: body.fundraiseId }
        })

        if (!fundraise) {
            return NextResponse.json(
                { error: 'Fundraise not found' },
                { status: 404 }
            )
        }

        if (fundraise.status !== 'active') {
            return NextResponse.json(
                { error: 'Cannot pledge to inactive fundraise' },
                { status: 400 }
            )
        }

        // Check if deadline has passed
        if (new Date() > fundraise.deadline) {
            return NextResponse.json(
                { error: 'Fundraise deadline has passed' },
                { status: 400 }
            )
        }

        // If stakerUserId is provided, check if staker exists
        if (stakerUserId) {
            const staker = await prisma.user.findUnique({
                where: { id: stakerUserId }
            })

            if (!staker) {
                return NextResponse.json(
                    { error: 'Staker not found' },
                    { status: 404 }
                )
            }
        }

        // Check if staker is trying to pledge to their own fundraise
        if (stakerUserId && fundraise.userId === stakerUserId) {
            return NextResponse.json(
                { error: 'Cannot pledge to your own fundraise' },
                { status: 400 }
            )
        }

        // Check if staker already has an active pledge for this fundraise
        const existingPledgeWhere: any = {
            fundraiseId: body.fundraiseId,
            status: 'active'
        }

        if (stakerUserId) {
            existingPledgeWhere.stakerUserId = stakerUserId
        } else {
            existingPledgeWhere.stakerWalletAddress = stakerWalletAddress
        }

        const existingPledge = await prisma.pledge.findFirst({
            where: existingPledgeWhere
        })

        if (existingPledge) {
            return NextResponse.json(
                { error: 'Active pledge already exists for this fundraise' },
                { status: 409 }
            )
        }

        // Create new pledge
        const pledgeData: any = {
            fundraiseId: body.fundraiseId,
            perKmRate: body.perKmRate,
            totalAmountPledged: body.totalAmountPledged,
            amountRemaining: body.totalAmountPledged
        }

        if (stakerUserId) {
            pledgeData.stakerUserId = stakerUserId
        } else {
            pledgeData.stakerWalletAddress = stakerWalletAddress
        }

        const pledge = await prisma.pledge.create({
            data: pledgeData,
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
                },
                staker: {
                    select: {
                        id: true,
                        privyUserId: true
                    }
                }
            }
        })

        return NextResponse.json(
            {
                message: 'Pledge created successfully',
                pledge: {
                    id: pledge.id,
                    fundraiseId: pledge.fundraiseId,
                    stakerUserId: pledge.stakerUserId,
                    perKmRate: pledge.perKmRate,
                    totalAmountPledged: pledge.totalAmountPledged,
                    amountRemaining: pledge.amountRemaining,
                    amountPaidOut: pledge.amountPaidOut,
                    status: pledge.status,
                    createdAt: pledge.createdAt,
                    fundraise: pledge.fundraise,
                    staker: pledge.staker
                }
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
        console.error('Error creating pledge:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { pledgeId, escrowTxHash } = body

        if (!pledgeId || !escrowTxHash) {
            return NextResponse.json(
                { error: 'Pledge ID and transaction hash are required' },
                { status: 400 }
            )
        }

        // Get the pledge details to create escrow transaction
        const pledge = await prisma.pledge.findUnique({
            where: { id: pledgeId }
        })

        if (!pledge) {
            return NextResponse.json(
                { error: 'Pledge not found' },
                { status: 404 }
            )
        }

        // Use a transaction to update pledge and create escrow transaction
        const [updatedPledge, escrowTransaction] = await prisma.$transaction([
            // Update pledge with transaction hash
            prisma.pledge.update({
                where: { id: pledgeId },
                data: {
                    escrowTxHash,
                    status: 'pending', // Will be updated to 'active' when transaction is confirmed
                },
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
                    },
                    staker: {
                        select: {
                            id: true,
                            privyUserId: true
                        }
                    }
                }
            }),
            // Create escrow transaction record
            prisma.escrowTransaction.create({
                data: {
                    pledgeId,
                    fromAddress: pledge.stakerWalletAddress || 'unknown',
                    toAddress: process.env.ESCROW_WALLET_ADDRESS || 'unknown',
                    amount: Number(pledge.totalAmountPledged),
                    txHash: escrowTxHash,
                    status: 'pending',
                }
            })
        ])

        return NextResponse.json({
            message: 'Pledge updated successfully',
            pledge: updatedPledge,
            escrowTransaction
        })
    } catch (error) {
        console.error('Error updating pledge:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}