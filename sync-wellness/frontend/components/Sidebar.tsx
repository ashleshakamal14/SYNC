'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Heart,
  LayoutDashboard,
  Calendar,
  Smile,
  Activity,
  Apple,
  Bell,
  MessageCircle,
  Users,
  FileText,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cycle Tracking', href: '/cycle', icon: Calendar },
  { name: 'Mood & Journal', href: '/mood', icon: Smile },
  { name: 'Symptoms', href: '/symptoms', icon: Activity },
  { name: 'Nutrition & Water', href: '/nutrition', icon: Apple },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'AI Wellness Chat', href: '/chat', icon: MessageCircle, badge: 'AI' },
  { name: 'Partner Mode', href: '/partner', icon: Users },
  { name: 'Reports & Analytics', href: '/reports', icon: FileText },
  { name: 'My Profile', href: '/profile', icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-rose-100/60 min-h-screen flex flex-col justify-between p-4 fixed left-0 top-0 bottom-0 z-30 shadow-sm">
      <div>
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-4 mb-4 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                SYNC
              </span>
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">
              WOMEN'S WELLNESS
            </p>
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-50 text-pink-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-rose-50/50 hover:text-pink-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 ${
                      isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-pink-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-purple-500 text-white tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom user card and logout */}
      <div className="pt-4 border-t border-rose-100/60">
        {user ? (
          <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-rose-50/40 transition">
            <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold wellness-gradient-btn"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  )
}
