'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Heart, Menu, X, Bell, User, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100/70 px-4 py-3 flex items-center justify-between shadow-xs">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="font-bold text-lg bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          SYNC
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/reminders"
          className="p-2 text-gray-500 hover:text-pink-600 hover:bg-rose-50 rounded-xl"
        >
          <Bell className="w-5 h-5" />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-pink-600 hover:bg-rose-50 rounded-xl"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-rose-100 p-4 shadow-lg flex flex-col gap-2">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Dashboard
          </Link>
          <Link
            href="/cycle"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Cycle Tracking
          </Link>
          <Link
            href="/mood"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Mood & Journal
          </Link>
          <Link
            href="/symptoms"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Symptoms
          </Link>
          <Link
            href="/nutrition"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Nutrition & Water
          </Link>
          <Link
            href="/reminders"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Reminders
          </Link>
          <Link
            href="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium text-pink-600 font-semibold hover:bg-rose-50 rounded-lg flex items-center justify-between"
          >
            <span>AI Wellness Chat</span>
            <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">AI</span>
          </Link>
          <Link
            href="/partner"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Partner Mode
          </Link>
          <Link
            href="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Reports & Analytics
          </Link>
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-sm font-medium hover:text-pink-600 hover:bg-rose-50 rounded-lg"
          >
            Profile
          </Link>
          {user && (
            <button
              onClick={() => {
                logout()
                setMobileMenuOpen(false)
              }}
              className="mt-2 text-left p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
