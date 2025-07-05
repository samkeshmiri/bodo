import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Clear existing data
    await prisma.payout.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.pledge.deleteMany()
    await prisma.fundraise.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.user.deleteMany()

    console.log('🧹 Cleared existing data')

    // Create sample users
    const user1 = await prisma.user.create({
        data: {
            privyUserId: 'privy_user_1',
            stravaId: '12345',
            status: 'active'
        }
    })

    const user2 = await prisma.user.create({
        data: {
            privyUserId: 'privy_user_2',
            stravaId: '67890',
            status: 'active'
        }
    })

    const user3 = await prisma.user.create({
        data: {
            privyUserId: 'privy_user_3',
            status: 'active'
        }
    })

    console.log('👥 Created sample users')

    // Create sample wallets
    await prisma.wallet.create({
        data: {
            userId: user1.id,
            address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            provider: 'Privy',
            status: 'active'
        }
    })

    await prisma.wallet.create({
        data: {
            userId: user2.id,
            address: '0x8ba1f109551bD432803012645Hac136c772c3c3',
            provider: 'manual',
            status: 'active'
        }
    })

    await prisma.wallet.create({
        data: {
            userId: user3.id,
            address: '0x1234567890123456789012345678901234567890',
            provider: 'Privy',
            status: 'active'
        }
    })

    console.log('💼 Created sample wallets')

    // Create sample fundraises
    const fundraise1 = await prisma.fundraise.create({
        data: {
            userId: user1.id,
            title: 'Marathon for Cancer Research',
            description: 'Running a marathon to raise funds for cancer research',
            targetAmount: 1000,
            deadline: new Date('2024-12-31'),
            status: 'active',
            shareableLink: 'marathon-cancer-' + Math.random().toString(36).substring(2, 10),
        }
    })

    const fundraise2 = await prisma.fundraise.create({
        data: {
            userId: user2.id,
            title: '100km Cycling Challenge',
            description: 'Cycling 100km to support local charities',
            targetAmount: 500,
            deadline: new Date('2024-11-30'),
            status: 'active',
            shareableLink: 'cycling-challenge-' + Math.random().toString(36).substring(2, 10),
        }
    })

    console.log('🎯 Created sample fundraises')

    // Create sample pledges
    await prisma.pledge.create({
        data: {
            fundraiseId: fundraise1.id,
            stakerUserId: user2.id,
            perKmRate: 2.5,
            totalAmountPledged: 500,
            amountRemaining: 500,
            amountPaidOut: 0,
            status: 'active'
        }
    })

    await prisma.pledge.create({
        data: {
            fundraiseId: fundraise1.id,
            stakerUserId: user3.id,
            perKmRate: 1.0,
            totalAmountPledged: 300,
            amountRemaining: 300,
            amountPaidOut: 0,
            status: 'active'
        }
    })

    await prisma.pledge.create({
        data: {
            fundraiseId: fundraise2.id,
            stakerUserId: user1.id,
            perKmRate: 3.0,
            totalAmountPledged: 400,
            amountRemaining: 400,
            amountPaidOut: 0,
            status: 'active'
        }
    })

    console.log('🤝 Created sample pledges')

    // Create sample activities
    const activity1 = await prisma.activity.create({
        data: {
            fundraiserUserId: user1.id,
            distance: 5.2,
            source: 'Strava',
            externalActivityId: 'strava_activity_1',
            activityDate: new Date('2024-06-01T09:00:00Z'),
        }
    })

    const activity2 = await prisma.activity.create({
        data: {
            fundraiserUserId: user2.id,
            distance: 15.8,
            source: 'Strava',
            externalActivityId: 'strava_activity_2',
            activityDate: new Date('2024-06-02T10:00:00Z'),
        }
    })

    console.log('🏃 Created sample activities')

    // Process payouts for the activities
    const { escrowService } = await import('../lib/escrow')

    console.log('💰 Processing payouts for activities...')

    const payouts1 = await escrowService.processActivity(activity1.id)
    const payouts2 = await escrowService.processActivity(activity2.id)

    console.log(`✅ Processed ${payouts1.length} payouts for activity 1`)
    console.log(`✅ Processed ${payouts2.length} payouts for activity 2`)

    console.log('🎉 Database seeding completed!')

    // Display summary
    const userCount = await prisma.user.count()
    const fundraiseCount = await prisma.fundraise.count()
    const pledgeCount = await prisma.pledge.count()
    const activityCount = await prisma.activity.count()
    const payoutCount = await prisma.payout.count()

    console.log('\n📊 Database Summary:')
    console.log(`Users: ${userCount}`)
    console.log(`Fundraises: ${fundraiseCount}`)
    console.log(`Pledges: ${pledgeCount}`)
    console.log(`Activities: ${activityCount}`)
    console.log(`Payouts: ${payoutCount}`)

    console.log('\n🔗 Sample API endpoints to test:')
    console.log('GET  http://localhost:3000/api/user')
    console.log('GET  http://localhost:3000/api/fundraise')
    console.log('GET  http://localhost:3000/api/pledge')
    console.log('POST http://localhost:3000/api/webhook/strava/manual')
    console.log('\n🌐 Frontend pages:')
    console.log('http://localhost:3000')
    console.log('http://localhost:3000/fundraises')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 