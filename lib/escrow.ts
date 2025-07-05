import { ethers } from 'ethers'
import { prisma } from './prisma'
import { PrivyClient } from '@privy-io/server-auth'

// Lazy-load provider and escrow wallet to avoid build-time initialization
let provider: ethers.JsonRpcProvider | null = null
let escrowWallet: ethers.Wallet | null = null

// Lazy-load Privy client for escrow wallet
let privyClient: PrivyClient | null = null

function getProvider(): ethers.JsonRpcProvider {
    if (!provider) {
        // Use Privy's RPC endpoint for Sepolia
        const privyRpcUrl = `https://rpc.privy.io/v1/${process.env.PRIVY_APP_ID}/sepolia`
        provider = new ethers.JsonRpcProvider(privyRpcUrl)
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
            const receipt = await getProvider().getTransactionReceipt(escrowTx.txHash)

            if (receipt) {
                const status = receipt.status === 1 ? 'confirmed' : 'failed'

                await prisma.escrowTransaction.update({
                    where: { id: escrowTx.id },
                    data: {
                        status,
                        blockNumber: receipt.blockNumber,
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
                }
            }
        } catch (error) {
            console.error(`Error checking transaction status for ${escrowTx.txHash}:`, error)
        }
    }

    async processPayout(pledgeId: string, activityId: string, amount: number): Promise<string> {
        try {
            // Get pledge and activity details
            const pledge = await prisma.pledge.findUnique({
                where: { id: pledgeId },
                include: { fundraise: { include: { user: { include: { wallets: true } } } } },
            })

            if (!pledge) {
                throw new Error('Pledge not found')
            }

            const activity = await prisma.activity.findUnique({
                where: { id: activityId },
            })

            if (!activity) {
                throw new Error('Activity not found')
            }

            // Get user's wallet address
            const userWallet = pledge.fundraise.user.wallets.find(w => w.status === 'active')
            if (!userWallet) {
                throw new Error('User wallet not found')
            }

            // USDC contract address on Sepolia testnet
            const USDC_CONTRACT_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

            // Convert payout amount to USDC (6 decimals)
            const usdcAmount = ethers.parseUnits(amount.toString(), 6).toString();

            // Use escrow wallet's private key to send USDC
            if (!process.env.ESCROW_WALLET_PRIVATE_KEY) {
                throw new Error('ESCROW_WALLET_PRIVATE_KEY environment variable is required');
            }

            const escrowWallet = new ethers.Wallet(process.env.ESCROW_WALLET_PRIVATE_KEY, getProvider());
            const tx = await escrowWallet.sendTransaction({
                to: USDC_CONTRACT_ADDRESS,
                value: '0x0', // No ETH sent, only USDC tokens
                data: new ethers.Interface([
                    'function transfer(address to, uint256 amount) returns (bool)'
                ]).encodeFunctionData('transfer', [userWallet.address, usdcAmount]),
            });

            // Get transaction hash
            const txHash = tx.hash;

            // Create payout record
            await prisma.payout.create({
                data: {
                    pledgeId,
                    activityId,
                    amount: amount,
                    status: 'completed',
                    txHash: txHash,
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

            return txHash;
        } catch (error) {
            console.error('Error processing payout:', error)
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
            await prisma.escrowTransaction.create({
                data: {
                    pledgeId,
                    fromAddress,
                    toAddress: process.env.ESCROW_WALLET_ADDRESS!,
                    amount,
                    txHash,
                    status: 'pending',
                },
            })
        } catch (error) {
            console.error('Error creating escrow transaction:', error)
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

            // Find all active pledges for the fundraiser
            const pledges = await prisma.pledge.findMany({
                where: {
                    fundraiseId: activity.fundraiserUserId,
                    status: 'active',
                },
            })

            // Process payouts for each pledge
            const payouts = []
            for (const pledge of pledges) {
                try {
                    const txHash = await this.processPayout(pledge.id, activityId, Number(pledge.perKmRate) * Number(activity.distance))
                    payouts.push({ pledgeId: pledge.id, txHash })
                } catch (error) {
                    payouts.push({ pledgeId: pledge.id, error: error instanceof Error ? error.message : error })
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