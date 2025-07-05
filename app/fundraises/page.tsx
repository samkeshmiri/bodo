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

export default async function FundraisesPage() {
  const fundraises = await getFundraises()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">🏃‍♂️ Bodo</h1>
            </Link>
            <nav className="flex space-x-8">
              <Link href="/fundraises" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Fundraises
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Active Fundraising Campaigns</h1>
          <div className="text-sm text-gray-500">
            {fundraises.length} campaign{fundraises.length !== 1 ? 's' : ''}
          </div>
        </div>

        {fundraises.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fundraises yet</h3>
            <p className="text-gray-500">Be the first to create a fundraising campaign!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fundraises.map((fundraise) => (
              <div key={fundraise.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {fundraise.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      fundraise.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : fundraise.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {fundraise.status}
                    </span>
                  </div>
                  
                  {fundraise.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {fundraise.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{fundraise.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(fundraise.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Target</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ${Number(fundraise.targetAmount).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Pledged</div>
                      <div className="text-lg font-semibold text-green-600">
                        ${fundraise.totalPledged.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500">Deadline</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(fundraise.deadline).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {fundraise.user.privyUserId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {fundraise.user.privyUserId}
                      </span>
                    </div>
                    <Link 
                      href={`/fundraise/${fundraise.id}`}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 