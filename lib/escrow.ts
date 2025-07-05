import { ethers } from 'ethers'
import { prisma } from './prisma'
import { PrivyClient } from '@privy-io/server-auth'

// NOTE: This is a SIMULATED escrow service for demo purposes.
// All blockchain transactions are simulated and no actual crypto is transferred.
// In production, this would integrate with real blockchain networks.

// Lazy-load provider and escrow wallet to avoid build-time initialization
let provider: ethers.JsonRpcProvider | null = null
let escrowWallet: ethers.Wallet | null = null

// Lazy-load Privy client for escrow wallet
let privyClient: PrivyClient | null = null

function getProvider(): ethers.JsonRpcProvider {
    if (!provider) {
        // Use a reliable Sepolia RPC endpoint
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
        provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    return provider
}

function getPrivyClient(): PrivyClient {
    if (!privyClient) {
        if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
            throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET environment variables are required');
        }
        privyClient = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
    }
    return privyClient;
}

export interface EscrowTransaction {
    id: string
    pledgeId: string
    fromAddress: string
    toAddress: string
    amount: string
    txHash: string
    status: 'pending' | 'confirmed' | 'failed'
}

export class EscrowService {
    private static instance: EscrowService

    private constructor() { }

    static getInstance(): EscrowService {
        if (!EscrowService.instance) {
            EscrowService.instance = new EscrowService()
        }
        return EscrowService.instance
    }

    async monitorEscrowWallet(): Promise<void> {
        try {
            // Get pending escrow transactions
            const pendingTransactions = await prisma.escrowTransaction.findMany({
                where: { status: 'pending' },
                include: { pledge: true },
            })

            for (const escrowTx of pendingTransactions) {
                await this.checkTransactionStatus(escrowTx)
            }
        } catch (error) {
            console.error('Error monitoring escrow wallet:', error)
        }
    }

    private async checkTransactionStatus(escrowTx: any): Promise<void> {
        try {
            console.log(`Simulating transaction status check for ${escrowTx.txHash}`)

            // Simulate transaction confirmation (always successful for demo)
            const status = 'confirmed'
            const blockNumber = Math.floor(Math.random() * 1000000) + 1000000 // Random block number

            await prisma.escrowTransaction.update({
                where: { id: escrowTx.id },
                data: {
                    status,
                    blockNumber,
                },
            })

            if (status === 'confirmed') {
                // Update pledge status
                await prisma.pledge.update({
                    where: { id: escrowTx.pledgeId },
                    data: {
                        escrowConfirmed: true,
                        status: 'active',
                    },
                })
                console.log(`Simulated transaction confirmed for pledge ${escrowTx.pledgeId}`)
            }
        } catch (error) {
            console.error(`Error checking simulated transaction status for ${escrowTx.txHash}:`, error)
        }
    }

    async processPayout(pledgeId: string, activityId: string, amount: number): Promise<string> {
        try {
            console.log(`Starting simulated payout process for pledge ${pledgeId}, activity ${activityId}, amount ${amount}`)

            // Get pledge and activity details
            const pledge = await prisma.pledge.findUnique({
                where: { id: pledgeId },
                include: { fundraise: { include: { user: { include: { wallets: true } } } } },
            })

            if (!pledge) {
                throw new Error(`Pledge not found: ${pledgeId}`)
            }

            const activity = await prisma.activity.findUnique({
                where: { id: activityId },
            })

            if (!activity) {
                throw new Error(`Activity not found: ${activityId}`)
            }

            // Get user's wallet address
            const userWallet = pledge.fundraise.user.wallets.find(w => w.status === 'active')
            if (!userWallet) {
                throw new Error(`User wallet not found for user ${pledge.fundraise.user.id}`)
            }

            console.log(`Found user wallet: ${userWallet.address}`)

            // Generate a fake transaction hash for simulation
            const fakeTxHash = `0x${Math.random().toString(16).substring(2, 66).padEnd(64, '0')}`;
            console.log(`Simulated transaction hash: ${fakeTxHash}`);

            // Create payout record
            await prisma.payout.create({
                data: {
                    pledgeId,
                    activityId,
                    amount: amount,
                    status: 'completed',
                    txHash: fakeTxHash,
                },
            })

            // Update pledge amounts
            await prisma.pledge.update({
                where: { id: pledgeId },
                data: {
                    amountPaidOut: {
                        increment: amount,
                    },
                    amountRemaining: {
                        decrement: amount,
                    },
                },
            })

            console.log(`Successfully simulated payout: ${amount} to ${userWallet.address}`);

            return fakeTxHash;
        } catch (error) {
            console.error('Error processing simulated payout:', error)
            throw error
        }
    }

    async createEscrowTransaction(
        pledgeId: string,
        fromAddress: string,
        amount: number,
        txHash: string
    ): Promise<void> {
        try {
            console.log(`Creating simulated escrow transaction for pledge ${pledgeId}`)

            await prisma.escrowTransaction.create({
                data: {
                    pledgeId,
                    fromAddress,
                    toAddress: process.env.ESCROW_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
                    amount,
                    txHash,
                    status: 'pending',
                },
            })

            console.log(`Simulated escrow transaction created for pledge ${pledgeId}`)
        } catch (error) {
            console.error('Error creating simulated escrow transaction:', error)
            throw error
        }
    }

    async matchTransactionToPledge(fromAddress: string, amount: number): Promise<string | null> {
        try {
            // Find pending pledge that matches the transaction
            const pledge = await prisma.pledge.findFirst({
                where: {
                    stakerWalletAddress: fromAddress.toLowerCase(),
                    totalAmountPledged: amount,
                    status: 'pending',
                    escrowConfirmed: false,
                },
            })

            return pledge?.id || null
        } catch (error) {
            console.error('Error matching transaction to pledge:', error)
            return null
        }
    }

    // Process payouts for all pledges for a given activity
    async processActivity(activityId: string): Promise<any[]> {
        try {
            // Find the activity
            const activity = await prisma.activity.findUnique({
                where: { id: activityId },
            })
            if (!activity) throw new Error('Activity not found')

            console.log(`Processing activity ${activityId} for user ${activity.fundraiserUserId}, distance: ${activity.distance}km`)

            // Find all active pledges for the fundraiser
            const pledges = await prisma.pledge.findMany({
                where: {
                    fundraise: {
                        userId: activity.fundraiserUserId
                    },
                    status: 'active',
                },
                include: {
                    fundraise: {
                        include: {
                            user: {
                                include: {
                                    wallets: true
                                }
                            }
                        }
                    }
                }
            })

            console.log(`Found ${pledges.length} active pledges for activity ${activityId}`)

            // Process payouts for each pledge
            const payouts = []
            for (const pledge of pledges) {
                try {
                    const payoutAmount = Number(pledge.perKmRate) * Number(activity.distance)
                    console.log(`Processing payout for pledge ${pledge.id}: ${payoutAmount} (${pledge.perKmRate} per km * ${activity.distance} km)`)

                    const txHash = await this.processPayout(pledge.id, activityId, payoutAmount)
                    payouts.push({ pledgeId: pledge.id, txHash, status: 'success' })
                } catch (error) {
                    console.error(`Error processing payout for pledge ${pledge.id}:`, error)
                    payouts.push({
                        pledgeId: pledge.id,
                        error: error instanceof Error ? error.message : String(error),
                        status: 'failed'
                    })
                }
            }
            return payouts
        } catch (error) {
            console.error('Error processing activity:', error)
            throw error
        }
    }
}

// Export singleton instance
export const escrowService = EscrowService.getInstance() 