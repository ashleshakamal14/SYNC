'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import PhaseBadge from '@/components/PhaseBadge'
import { useAuth } from '@/hooks/useAuth'
import {
  analyticsService,
  cycleService,
  aiService,
  reminderService,
} from '@/services/api'
import {
  Heart,
  Calendar,
  Smile,
  Activity,
  Droplets,
  Bell,
  Sparkles,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { PHASE_COLORS, PHASE_EMOJIS, formatDateShort, capitalize } from '@/lib/constants'

export default function DashboardPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [cycleInfo, setCycleInfo] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [aiRecs, setAiRecs] = useState<any>(null)
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, dRes, aiRes, rRes] = await Promise.all([
          cycleService.getCurrent().catch(() => null),
          analyticsService.getDashboard().catch(() => null),
          aiService.getRecommendations().catch(() => null),
          reminderService.getUpcoming().catch(() => []),
        ])

        setCycleInfo(cRes)
        setDashboardData(dRes)
        setAiRecs(aiRes)
        setUpcomingReminders(rRes || [])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleCompleteReminder = async (id: number) => {
    try {
      await reminderService.complete(id)
      setUpcomingReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Failed to complete reminder:', err)
    }
  }

  const hasAnyData =
    dashboardData?.has_cycle_data ||
    (dashboardData?.mood_chart && dashboardData.mood_chart.length > 0)

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome, {user?.name?.split(' ')[0] || 'there'} 🌸
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Here is your holistic health and cycle overview for today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cycle"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-pink-700 hover:bg-rose-100 transition border border-pink-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Period</span>
            </Link>
            <Link
              href="/mood"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition border border-purple-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Mood</span>
            </Link>
          </div>
        </div>

        {/* Empty State for brand new users */}
        {!loading && !hasAnyData && (
          <div className="wellness-card p-8 text-center bg-gradient-to-tr from-rose-50/50 via-white to-purple-50/30 border-rose-200/80">
            <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Start Your SYNC Journey
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              You haven&apos;t logged any period or wellness data yet. Add your first cycle start date to unlock personalized predictions and phase insights!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/cycle"
                className="px-6 py-2.5 rounded-full text-xs font-bold wellness-gradient-btn shadow-md text-white flex items-center gap-2"
              >
                <span>Log First Cycle</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/mood"
                className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
              >
                Log Today&apos;s Mood
              </Link>
            </div>
          </div>
        )}

        {/* Top Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Cycle Phase */}
          <div className="wellness-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cycle Phase
              </span>
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div>
              {cycleInfo?.has_data ? (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900">
                      Day {cycleInfo.metrics?.cycle_day || 1}
                    </span>
                    <PhaseBadge phase={cycleInfo.metrics?.current_phase} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Cycle Length: ~{cycleInfo.metrics?.cycle_length} days
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-bold text-gray-800">Not Logged</p>
                  <Link href="/cycle" className="text-xs text-pink-600 hover:underline">
                    Add cycle details &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Next Estimated Period */}
          <div className="wellness-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Next Period
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              {cycleInfo?.has_data && cycleInfo.metrics?.days_until_next_period !== undefined ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cycleInfo.metrics.days_until_next_period > 0
                      ? `In ${cycleInfo.metrics.days_until_next_period} days`
                      : cycleInfo.metrics.days_until_next_period === 0
                      ? 'Estimated Today'
                      : `${Math.abs(cycleInfo.metrics.days_until_next_period)} days ago`}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Est. {cycleInfo.metrics?.predicted_next_cycle}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-bold text-gray-800">—</p>
                  <p className="text-xs text-gray-400">Awaiting cycle data</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Fertile Window */}
          <div className="wellness-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Fertile Window
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              {cycleInfo?.has_data && cycleInfo.metrics?.fertile_window_start ? (
                <div>
                  <div className="text-base font-bold text-gray-900">
                    {formatDateShort(cycleInfo.metrics.fertile_window_start)} –{' '}
                    {formatDateShort(cycleInfo.metrics.fertile_window_end)}
                  </div>
                  <p className="text-xs text-amber-700 font-medium mt-1">
                    Ovulation Est: {formatDateShort(cycleInfo.metrics.ovulation_date)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-bold text-gray-800">—</p>
                  <p className="text-xs text-gray-400">Calculated after log</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Daily Water Intake */}
          <div className="wellness-card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Water Today
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {dashboardData?.water_today || 0}
                </span>
                <span className="text-xs text-gray-500 font-medium">/ 2.5 L</span>
              </div>
              <div className="w-full bg-blue-100/60 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((dashboardData?.water_today || 0) / 2.5) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phase Guide Banner & AI Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Phase Guidance Highlight */}
          <div className="lg:col-span-2 wellness-card p-6 border-pink-100 bg-gradient-to-br from-white via-rose-50/20 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                  {PHASE_EMOJIS[cycleInfo?.metrics?.current_phase as keyof typeof PHASE_EMOJIS] || '🌸'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Phase Guide — {cycleInfo?.phase_guide?.phase_name || 'Personalized Guidance'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {cycleInfo?.phase_guide?.description ||
                      'Log your period dates to receive personalized lifestyle tips.'}
                  </p>
                </div>
              </div>
              <Link
                href="/cycle"
                className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1"
              >
                <span>Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {cycleInfo?.phase_guide ? (
              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs text-gray-700">
                <div className="bg-white/80 p-3 rounded-xl border border-rose-100">
                  <strong className="text-pink-700 block mb-1">🥗 Nutrition</strong>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {cycleInfo.phase_guide.nutrition.slice(0, 2).map((n: string, i: number) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-rose-100">
                  <strong className="text-purple-700 block mb-1">🏃 Movement</strong>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {cycleInfo.phase_guide.exercise.slice(0, 2).map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic mt-2">
                Once you log your period start date, your daily nutrition and movement suggestions will appear here.
              </p>
            )}
          </div>

          {/* AI Insights Card */}
          <div className="wellness-card p-6 border-purple-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">AI Wellness Insight</h3>
              </div>

              {aiRecs?.recommendations && aiRecs.recommendations.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-purple-50/70 border border-purple-200/60 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                      <span>{aiRecs.recommendations[0].emoji}</span>
                      <span>{aiRecs.recommendations[0].title}</span>
                    </div>
                    <p className="text-xs text-purple-800 leading-relaxed">
                      {aiRecs.recommendations[0].suggestion}
                    </p>
                    <p className="text-[10px] text-purple-500 mt-1 italic">
                      Reason: {aiRecs.recommendations[0].reason}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Keep logging your mood, water intake, and symptoms to unlock AI-driven wellness observations.
                </p>
              )}
            </div>

            <Link
              href="/chat"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Wellness Companion</span>
            </Link>
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Trend Chart */}
          <div className="wellness-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Weekly Mood &amp; Stress Trend</h3>
                <p className="text-xs text-gray-400">Stress and energy levels (1–10)</p>
              </div>
              <Link href="/mood" className="text-xs text-pink-600 font-semibold hover:underline">
                View All &rarr;
              </Link>
            </div>

            {dashboardData?.mood_chart && dashboardData.mood_chart.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.mood_chart}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => formatDateShort(val)}
                      fontSize={11}
                      stroke="#9CA3AF"
                    />
                    <YAxis domain={[0, 10]} fontSize={11} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #FBCFE8',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      name="Energy"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      name="Stress"
                      stroke="#EC4899"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center">
                <Smile className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">No mood entries logged yet this week.</p>
                <Link href="/mood" className="text-xs font-semibold text-pink-600 mt-1 hover:underline">
                  Log your mood now
                </Link>
              </div>
            )}
          </div>

          {/* Recent Symptoms Summary */}
          <div className="wellness-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Recent Symptoms Frequency</h3>
                <p className="text-xs text-gray-400">Logged in the past 30 days</p>
              </div>
              <Link href="/symptoms" className="text-xs text-pink-600 font-semibold hover:underline">
                Log Symptom &rarr;
              </Link>
            </div>

            {dashboardData?.symptom_frequency &&
            Object.keys(dashboardData.symptom_frequency).length > 0 ? (
              <div className="space-y-3 pt-2">
                {Object.entries(dashboardData.symptom_frequency).map(
                  ([stype, count]: [string, any]) => (
                    <div key={stype} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 capitalize">
                        {capitalize(stype)}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 sm:w-44 bg-rose-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (count / 10) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-gray-500 font-bold w-4 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center">
                <Activity className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">No symptoms reported recently.</p>
                <Link
                  href="/symptoms"
                  className="text-xs font-semibold text-pink-600 mt-1 hover:underline"
                >
                  Track symptoms
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders Widget */}
        <div className="wellness-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-pink-600" />
              <h3 className="font-bold text-gray-900 text-sm">Upcoming Reminders</h3>
            </div>
            <Link href="/reminders" className="text-xs text-pink-600 font-semibold hover:underline">
              Manage All Reminders &rarr;
            </Link>
          </div>

          {upcomingReminders.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {upcomingReminders.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:border-pink-200 transition"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">{r.title}</p>
                    <p className="text-[11px] text-gray-400 capitalize">
                      {r.type} • {new Date(r.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCompleteReminder(r.id)}
                    title="Mark Done"
                    className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-white rounded-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              No upcoming reminders right now. You can schedule medicine, water, or appointment reminders anytime!
            </p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
