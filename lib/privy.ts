import { PrivyClient } from '@privy-io/server-auth';
import { prisma } from './prisma';

const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

export interface PrivyUser {
    id: string;
    email?: string;
    wallet?: {
        address: string;
        chainId: number;
    };
}

export async function verifyPrivyToken(token: string): Promise<PrivyUser | null> {
    try {
        const verifiedClaims = await privy.verifyAuthToken(token);
        const claims = verifiedClaims as any; // Cast to any to handle type mismatches
        return {
            id: claims.userId,
            email: claims.email?.address,
            wallet: claims.wallet ? {
                address: claims.wallet.address,
                chainId: claims.wallet.chainId,
            } : undefined,
        };
    } catch (error) {
        console.error('Error verifying Privy token:', error);
        return null;
    }
}

export async function getOrCreateUser(privyUserId: string): Promise<any> {
    try {
        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { privyUserId },
            include: { wallets: true },
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    privyUserId,
                    status: 'pending',
                },
                include: { wallets: true },
            });
        }

        return user;
    } catch (error) {
        console.error('Error getting or creating user:', error);
        throw error;
    }
}

export async function syncUserWallet(privyUserId: string, walletAddress: string): Promise<any> {
    try {
        const user = await prisma.user.findUnique({
            where: { privyUserId },
            include: { wallets: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if wallet already exists
        const existingWallet = user.wallets.find(w => w.address.toLowerCase() === walletAddress.toLowerCase());

        if (!existingWallet) {
            // Create new wallet
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    address: walletAddress,
                    provider: 'privy',
                    status: 'active',
                },
            });
        }

        return user;
    } catch (error) {
        console.error('Error syncing user wallet:', error);
        throw error;
    }
}

export async function getUserByPrivyId(privyUserId: string): Promise<any> {
    try {
        return await prisma.user.findUnique({
            where: { privyUserId },
            include: { wallets: true, fundraises: true },
        });
    } catch (error) {
        console.error('Error getting user by Privy ID:', error);
        throw error;
    }
} 