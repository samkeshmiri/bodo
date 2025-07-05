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
        const body = await validateRequest(createPledgeSchema, request)

        // For now, we'll get stakerUserId from the request body
        // In a real app, this would come from authentication middleware
        const { stakerUserId } = await request.json()

        if (!stakerUserId) {
            return NextResponse.json(
                { error: 'Staker user ID is required' },
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

        // Check if staker exists
        const staker = await prisma.user.findUnique({
            where: { id: stakerUserId }
        })

        if (!staker) {
            return NextResponse.json(
                { error: 'Staker not found' },
                { status: 404 }
            )
        }

        // Check if staker is trying to pledge to their own fundraise
        if (fundraise.userId === stakerUserId) {
            return NextResponse.json(
                { error: 'Cannot pledge to your own fundraise' },
                { status: 400 }
            )
        }

        // Check if staker already has an active pledge for this fundraise
        const existingPledge = await prisma.pledge.findFirst({
            where: {
                fundraiseId: body.fundraiseId,
                stakerUserId,
                status: 'active'
            }
        })

        if (existingPledge) {
            return NextResponse.json(
                { error: 'Active pledge already exists for this fundraise' },
                { status: 409 }
            )
        }

        // Create new pledge
        const pledge = await prisma.pledge.create({
            data: {
                fundraiseId: body.fundraiseId,
                stakerUserId,
                perKmRate: body.perKmRate,
                totalAmountPledged: body.totalAmountPledged,
                amountRemaining: body.totalAmountPledged
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