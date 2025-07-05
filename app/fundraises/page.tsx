import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getFundraises() {
  try {
    const fundraises = await prisma.fundraise.findMany({
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
    })

    return fundraises.map(fundraise => {
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
  } catch (error) {
    console.error('Error fetching fundraises:', error)
    return []
  }
}

export default function FundraisesPage() {
  return null;
} 