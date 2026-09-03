'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import PhaseBadge from '@/components/PhaseBadge'
import { cycleService } from '@/services/api'
import { Cycle } from '@/types'
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Heart,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { formatDate, formatDateShort, PHASE_COLORS, PHASE_EMOJIS } from '@/lib/constants'

export default function CyclePage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [currentInfo, setCurrentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadCycleData = async () => {
    try {
      const [list, curr] = await Promise.all([
        cycleService.getAll(),
        cycleService.getCurrent(),
      ])
      setCycles(list)
      setCurrentInfo(curr)
    } catch (err) {
      console.error('Error fetching cycle data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCycleData()
  }, [])

  const handleAddCycle = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setFormError('Period end date cannot be earlier than start date.')
      return
    }

    setSubmitting(true)
    try {
      await cycleService.create({
        period_start: startDate,
        period_end: endDate || undefined,
        cycle_length: Number(cycleLength),
        period_length: Number(periodLength),
        notes: notes || undefined,
      })
      // Reset form
      setNotes('')
      setEndDate('')
      await loadCycleData()
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to log cycle record.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cycle record?')) return
    try {
      await cycleService.delete(id)
      await loadCycleData()
    } catch (err) {
      console.error('Failed to delete cycle record:', err)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Menstrual Cycle Tracking 🌙
            </h1>
            <p className="text-sm text-gray-500">
              Track periods, estimate cycle phases, and view fertility windows.
            </p>
          </div>
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rule-based &amp; ML Assisted Estimates</span>
          </div>
        </div>

        {/* Current Cycle Highlights Banner */}
        {currentInfo?.has_data && (
          <div className="wellness-card p-6 border-pink-200 bg-gradient-to-r from-rose-50/60 via-white to-purple-50/40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="border-r border-rose-100 last:border-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Current Day
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    Day {currentInfo.metrics?.cycle_day}
                  </span>
                  <PhaseBadge phase={currentInfo.metrics?.current_phase} />
                </div>
              </div>

              <div className="border-r border-rose-100 last:border-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Next Period Est.
                </span>
                <div className="text-xl font-bold text-pink-700 mt-1">
                  {currentInfo.metrics?.predicted_next_cycle
                    ? formatDate(currentInfo.metrics.predicted_next_cycle)
                    : '—'}
                </div>
                <span className="text-xs text-gray-400">
                  (~{currentInfo.metrics?.days_until_next_period} days)
                </span>
              </div>

              <div className="border-r border-rose-100 last:border-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Ovulation Est.
                </span>
                <div className="text-xl font-bold text-amber-700 mt-1">
                  {currentInfo.metrics?.ovulation_date
                    ? formatDate(currentInfo.metrics.ovulation_date)
                    : '—'}
                </div>
                <span className="text-xs text-gray-400">Peak fertility</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Fertile Window
                </span>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {currentInfo.metrics?.fertile_window_start &&
                    `${formatDateShort(currentInfo.metrics.fertile_window_start)} – ${formatDateShort(currentInfo.metrics.fertile_window_end)}`}
                </div>
                <span className="text-xs text-emerald-600 font-medium">Estimated Range</span>
              </div>
            </div>

            {currentInfo.irregularity_analysis?.observation && (
              <div className="mt-4 pt-4 border-t border-rose-100/70 text-xs text-gray-600 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-pink-500 shrink-0" />
                <span>{currentInfo.irregularity_analysis.observation}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cycle Logging Form */}
          <div className="wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Log Period Record</span>
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Add details of your recent or ongoing cycle.
            </p>

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Period Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Period End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cycle Length (days)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={cycleLength}
                    onChange={(e) => setCycleLength(Number(e.target.value))}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Period Length (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={periodLength}
                    onChange={(e) => setPeriodLength(Number(e.target.value))}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Flow intensity, spotting, or specific feelings..."
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50"
              >
                {submitting ? 'Saving Record...' : 'Save Cycle Record'}
              </button>
            </form>
          </div>

          {/* Cycle History Table & List */}
          <div className="lg:col-span-2 wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Cycle History</h2>
            <p className="text-xs text-gray-500 mb-4">
              All logged periods. Predictions automatically refine with more entries.
            </p>

            {cycles.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-rose-200" />
                <p className="text-sm">No cycle logs recorded yet.</p>
                <p className="text-xs text-gray-400">Log your first period to start tracking.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] font-bold uppercase text-gray-400 border-b border-rose-100">
                    <tr>
                      <th className="pb-3">Start Date</th>
                      <th className="pb-3">End Date</th>
                      <th className="pb-3">Cycle</th>
                      <th className="pb-3">Period</th>
                      <th className="pb-3">Phase</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {cycles.map((c) => (
                      <tr key={c.id} className="hover:bg-rose-50/30 transition">
                        <td className="py-3 font-semibold text-gray-900">
                          {formatDateShort(c.period_start)}
                        </td>
                        <td className="py-3 text-gray-600">
                          {c.period_end ? formatDateShort(c.period_end) : '—'}
                        </td>
                        <td className="py-3 text-gray-600">{c.cycle_length}d</td>
                        <td className="py-3 text-gray-600">{c.period_length}d</td>
                        <td className="py-3">
                          <PhaseBadge phase={c.current_phase} />
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Phase Educational Guide */}
        {currentInfo?.phase_guide && (
          <div className="wellness-card p-6 border-purple-100 bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                {currentInfo.phase_guide.emoji}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentInfo.phase_guide.phase_name} Guide
                </h3>
                <p className="text-xs text-gray-500">
                  {currentInfo.phase_guide.description}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-100">
                <h4 className="font-bold text-pink-800 mb-2">🥗 Nutrition Focus</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.nutrition.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-2">🏃 Movement &amp; Exercise</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.exercise.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                <h4 className="font-bold text-purple-800 mb-2">😴 Sleep &amp; Rest</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.sleep.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <h4 className="font-bold text-amber-800 mb-2">✨ Productivity &amp; Self-Care</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.productivity.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
