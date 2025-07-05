import { z } from 'zod'
import { NextRequest } from 'next/server'

// User validation schemas
export const createUserSchema = z.object({
    privyUserId: z.string().min(1, 'Privy user ID is required'),
    stravaId: z.string().optional(),
    status: z.string().optional(),
})

export const updateUserSchema = z.object({
    stravaId: z.string().optional(),
    stravaAccessToken: z.string().optional(),
    stravaRefreshToken: z.string().optional(),
    stravaTokenExpiresAt: z.string().datetime().optional(),
    status: z.enum(['active', 'pending']).optional(),
})

// Wallet validation schemas
export const createWalletSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    address: z.string().min(42, 'Invalid wallet address').max(42, 'Invalid wallet address'),
    provider: z.enum(['privy', 'manual']),
})

// Fundraise validation schemas
export const createFundraiseSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    description: z.string().optional(),
    targetAmount: z.number().positive('Target amount must be positive'),
    deadline: z.string().datetime('Invalid deadline date'),
})

export const updateFundraiseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
    description: z.string().optional(),
    targetAmount: z.number().positive('Target amount must be positive').optional(),
    deadline: z.string().datetime('Invalid deadline date').optional(),
    status: z.enum(['active', 'completed', 'expired']).optional(),
})

// Pledge validation schemas
export const createPledgeSchema = z.object({
    fundraiseId: z.string().uuid('Invalid fundraise ID'),
    stakerUserId: z.string().uuid('Invalid user ID').optional(),
    stakerWalletAddress: z.string().min(42, 'Invalid wallet address').max(42, 'Invalid wallet address').optional(),
    perKmRate: z.number().positive('Per km rate must be positive'),
    totalAmountPledged: z.number().positive('Total amount must be positive'),
})

export const updatePledgeSchema = z.object({
    escrowTxHash: z.string().min(1, 'Transaction hash is required').optional(),
    escrowConfirmed: z.boolean().optional(),
    status: z.enum(['pending', 'active', 'completed', 'expired']).optional(),
})

// Activity validation schemas
export const createActivitySchema = z.object({
    fundraiserUserId: z.string().uuid('Invalid user ID'),
    distance: z.number().positive('Distance must be positive'),
    source: z.string().min(1, 'Source is required'),
    externalActivityId: z.string().min(1, 'External activity ID is required'),
    activityDate: z.string().datetime('Invalid activity date'),
})

// Payout validation schemas
export const createPayoutSchema = z.object({
    pledgeId: z.string().uuid('Invalid pledge ID'),
    activityId: z.string().uuid('Invalid activity ID'),
    amount: z.number().positive('Amount must be positive'),
})

export const updatePayoutSchema = z.object({
    status: z.enum(['pending', 'completed', 'failed']).optional(),
    txHash: z.string().optional(),
})

// Escrow transaction validation schemas
export const createEscrowTransactionSchema = z.object({
    pledgeId: z.string().uuid('Invalid pledge ID'),
    fromAddress: z.string().min(42, 'Invalid from address').max(42, 'Invalid from address'),
    toAddress: z.string().min(42, 'Invalid to address').max(42, 'Invalid to address'),
    amount: z.number().positive('Amount must be positive'),
    txHash: z.string().min(1, 'Transaction hash is required'),
    blockNumber: z.number().optional(),
})

export const updateEscrowTransactionSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'failed']).optional(),
    blockNumber: z.number().optional(),
})

// Strava webhook validation
export const stravaWebhookSchema = z.object({
    object_type: z.string(),
    object_id: z.number(),
    aspect_type: z.string(),
    owner_id: z.number(),
    subscription_id: z.number(),
    event_time: z.number(),
    updates: z.record(z.any()).optional(),
})

// Strava OAuth validation
export const stravaAuthSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional(),
})

// Anonymous pledge form validation
export const anonymousPledgeSchema = z.object({
    fundraiseId: z.string().uuid('Invalid fundraise ID'),
    stakerWalletAddress: z.string().min(42, 'Invalid wallet address').max(42, 'Invalid wallet address'),
    perKmRate: z.number().positive('Per km rate must be positive'),
    totalAmountPledged: z.number().positive('Total amount must be positive'),
})

// Fundraise share link validation
export const fundraiseLinkSchema = z.object({
    shareableLink: z.string().min(1, 'Shareable link is required'),
})

// UUID validation helper
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Pagination schema
export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10)
})

// Validation helper function
export function validateBody<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
    return schema.parse(data)
}

// Validation helper for Next.js requests
export async function validateRequest<T extends z.ZodType>(
    schema: T,
    request: NextRequest
): Promise<z.infer<T>> {
    const body = await request.json()
    return schema.parse(body)
} 