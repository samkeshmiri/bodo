import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateRequest, createUserSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    privyUserId: true,
                    stravaId: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.user.count()
        ])

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await validateRequest(createUserSchema, request)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { privyUserId: body.privyUserId }
        })

        if (existingUser) {
            return NextResponse.json(
                {
                    error: 'User already exists',
                    userId: existingUser.id
                },
                { status: 409 }
            )
        }

        // Create new user
        const user = await prisma.user.create({
            data: {
                privyUserId: body.privyUserId,
                stravaId: body.stravaId,
                status: body.status
            }
        })

        // If walletAddress is present, create wallet record
        if (body.walletAddress) {
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    address: body.walletAddress,
                    provider: 'privy',
                    status: 'active'
                }
            });
        }

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: user.id,
                    privyUserId: user.privyUserId,
                    stravaId: user.stravaId,
                    status: user.status,
                    createdAt: user.createdAt
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

        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 