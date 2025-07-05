import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createFundraiseSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const userId = searchParams.get('userId')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}
        if (status) where.status = status
        if (userId) where.userId = userId

        const [fundraises, total] = await Promise.all([
            prisma.fundraise.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            privyUserId: true,
                            status: true
                        }
                    },
                    pledges: {
                        select: {
                            totalAmountPledged: true,
                            amountPaidOut: true
                        }
                    }
                }
            }),
            prisma.fundraise.count({ where })
        ])

        // Calculate totals for each fundraise
        const fundraisesWithTotals = fundraises.map(fundraise => {
            const totalPledged = fundraise.pledges.reduce((sum, pledge) => {
                return sum + Number(pledge.totalAmountPledged)
            }, 0)

            const totalPaidOut = fundraise.pledges.reduce((sum, pledge) => {
                return sum + Number(pledge.amountPaidOut)
            }, 0)

            return {
                ...fundraise,
                totalPledged,
                totalPaidOut,
                progress: (totalPledged / Number(fundraise.targetAmount)) * 100
            }
        })

        return NextResponse.json({
            fundraises: fundraisesWithTotals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching fundraises:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await validateRequest(createFundraiseSchema, request)

        // For now, we'll get userId from the request body
        // In a real app, this would come from authentication middleware
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Create new fundraise
        const fundraise = await prisma.fundraise.create({
            data: {
                userId,
                title: body.title,
                description: body.description,
                targetAmount: body.targetAmount,
                deadline: new Date(body.deadline)
            },
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

        return NextResponse.json(
            {
                message: 'Fundraise created successfully',
                fundraise: {
                    id: fundraise.id,
                    userId: fundraise.userId,
                    title: fundraise.title,
                    description: fundraise.description,
                    targetAmount: fundraise.targetAmount,
                    deadline: fundraise.deadline,
                    status: fundraise.status,
                    createdAt: fundraise.createdAt,
                    user: fundraise.user
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

        console.error('Error creating fundraise:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 