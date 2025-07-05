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
        const category = searchParams.get('category')
        const skip = (page - 1) * limit

        // Build where clause
        const where: any = {}
        if (status) where.status = status
        if (userId) where.userId = userId
        if (category) where.category = category

        const [campaigns, total] = await Promise.all([
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

        // Calculate totals for each campaign
        const campaignsWithTotals = campaigns.map((campaign: any) => {
            const totalPledged = campaign.pledges.reduce((sum: number, pledge: any) => {
                return sum + Number(pledge.totalAmountPledged)
            }, 0)

            const totalPaidOut = campaign.pledges.reduce((sum: number, pledge: any) => {
                return sum + Number(pledge.amountPaidOut)
            }, 0)

            return {
                ...campaign,
                totalPledged,
                totalPaidOut,
                progress: (totalPledged / Number(campaign.targetAmount)) * 100,
                daysRemaining: Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }
        })

        return NextResponse.json({
            campaigns: campaignsWithTotals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await validateRequest(createFundraiseSchema, request)

        // Use userId from the validated body
        const { userId } = body;

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

        // Create new campaign (using fundraise model)
        const campaign = await prisma.fundraise.create({
            data: {
                userId,
                title: body.title,
                description: body.description,
                targetAmount: body.targetAmount,
                deadline: body.deadline,
                shareableLink: Math.random().toString(36).substring(2, 10),
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
                message: 'Campaign created successfully',
                campaign: {
                    id: campaign.id,
                    userId: campaign.userId,
                    title: campaign.title,
                    description: campaign.description,
                    targetAmount: campaign.targetAmount,
                    deadline: campaign.deadline,
                    status: campaign.status,
                    createdAt: campaign.createdAt,
                    user: campaign.user
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

        console.error('Error creating campaign:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 