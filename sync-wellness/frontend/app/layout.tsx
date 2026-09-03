import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: "SYNC — AI-Powered Women's Wellness Companion",
  description:
    'Understand Your Body • Track Your Health • Feel Your Best. An intelligent platform for cycle tracking, mood insights, nutrition, and personalized wellness guidance.',
  keywords: [
    'womens wellness',
    'cycle tracking',
    'period tracker',
    'mood log',
    'symptom tracker',
    'wellness AI',
    'holistic health',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-gray-800">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
