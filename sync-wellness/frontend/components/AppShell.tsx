'use client'
import React, { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import DisclaimerBanner from '@/components/DisclaimerBanner'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface AppShellProps {
  children: ReactNode
  requireAuth?: boolean
}

export default function AppShell({ children, requireAuth = true }: AppShellProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push('/login')
    }
  }, [user, isLoading, requireAuth, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-3 border-pink-200 border-t-pink-600 animate-spin" />
          <p className="text-sm font-medium text-pink-700">Connecting to SYNC...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <DisclaimerBanner />
        {children}
      </main>
    </div>
  )
}
