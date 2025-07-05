import { NextRequest, NextResponse } from 'next/server';
import { escrowService } from '@/lib/escrow';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Manually trigger escrow monitoring
        await escrowService.monitorEscrowWallet();

        return NextResponse.json({
            message: 'Escrow monitoring completed successfully'
        });
    } catch (error) {
        console.error('Error monitoring escrow:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get pending escrow transactions
        const { searchParams } = new URL(request.url);
        const pledgeId = searchParams.get('pledgeId');

        if (pledgeId) {
            // Check specific pledge's escrow transaction
            const escrowTx = await prisma.escrowTransaction.findFirst({
                where: { pledgeId },
                include: { pledge: true }
            });

            return NextResponse.json({
                escrowTransaction: escrowTx
            });
        }

        // Get all pending transactions
        const pendingTransactions = await prisma.escrowTransaction.findMany({
            where: { status: 'pending' },
            include: { pledge: true }
        });

        return NextResponse.json({
            pendingTransactions
        });
    } catch (error) {
        console.error('Error getting escrow transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 