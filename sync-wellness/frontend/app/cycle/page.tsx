'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import PhaseBadge from '@/components/PhaseBadge'
import { cycleService } from '@/services/api'
import { Cycle, CyclePrediction, CycleStats } from '@/types'
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Heart,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react'
import { formatDate, formatDateShort, PHASE_COLORS, PHASE_EMOJIS } from '@/lib/constants'

export default function CyclePage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [currentInfo, setCurrentInfo] = useState<any>(null)
  const [stats, setStats] = useState<CycleStats | null>(null)
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null)
  const [loading, setLoading] = useState(true)

  // Form states (Add)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [cycleLength, setCycleLength] = useState(28)
  const [periodLength, setPeriodLength] = useState(5)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Edit modal states
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null)
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editCycleLength, setEditCycleLength] = useState(28)
  const [editPeriodLength, setEditPeriodLength] = useState(5)
  const [editNotes, setEditNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const loadCycleData = async () => {
    try {
      const [list, curr, statsRes, predRes] = await Promise.all([
        cycleService.getAll().catch(() => []),
        cycleService.getCurrent().catch(() => null),
        cycleService.getStats().catch(() => null),
        cycleService.getPrediction().catch(() => null),
      ])
      setCycles(list)
      setCurrentInfo(curr)
      setStats(statsRes)
      setPrediction(predRes)
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
    setSuccessMsg(null)

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
      setNotes('')
      setEndDate('')
      setSuccessMsg('Cycle record logged successfully! Prediction updated.')
      setTimeout(() => setSuccessMsg(null), 4000)
      await loadCycleData()
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to log cycle record.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (c: Cycle) => {
    setEditingCycle(c)
    setEditStartDate(c.period_start)
    setEditEndDate(c.period_end || '')
    setEditCycleLength(c.cycle_length)
    setEditPeriodLength(c.period_length)
    setEditNotes(c.notes || '')
  }

  const handleUpdateCycle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCycle) return
    setUpdating(true)
    try {
      await cycleService.update(editingCycle.id, {
        period_start: editStartDate,
        period_end: editEndDate || undefined,
        cycle_length: Number(editCycleLength),
        period_length: Number(editPeriodLength),
        notes: editNotes || undefined,
      })
      setEditingCycle(null)
      await loadCycleData()
    } catch (err) {
      console.error('Failed to update cycle:', err)
      alert('Failed to update cycle record.')
    } finally {
      setUpdating(false)
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Menstrual Cycle Tracking 🌙
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track periods, estimate cycle phases, and view AI next-cycle predictions.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {prediction?.method === 'ml' ? 'Random Forest ML Model' : 'Historical Averaging Engine'}
              </span>
            </span>
          </div>
        </div>

        {/* Current Cycle Highlights Banner */}
        {currentInfo?.has_data && (
          <div className="wellness-card p-6 border-pink-200 bg-gradient-to-r from-rose-50/70 via-white to-purple-50/50 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="border-r border-rose-100 last:border-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Current State
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    Day {currentInfo.metrics?.cycle_day || 1}
                  </span>
                  <PhaseBadge phase={currentInfo.metrics?.current_phase} />
                </div>
              </div>

              <div className="border-r border-rose-100 last:border-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Estimated Next Period
                </span>
                <div className="text-lg sm:text-xl font-bold text-pink-700 mt-1">
                  {prediction?.predicted_next_period
                    ? formatDate(prediction.predicted_next_period)
                    : currentInfo.metrics?.predicted_next_cycle
                    ? formatDate(currentInfo.metrics.predicted_next_cycle)
                    : '—'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                  <span>~{prediction?.predicted_cycle_length || currentInfo.metrics?.cycle_length}d cycle</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md font-semibold capitalize">
                    {prediction?.confidence || 'moderate'} conf.
                  </span>
                </div>
              </div>

              <div className="border-r border-rose-100 last:border-0 pr-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Ovulation Estimate
                </span>
                <div className="text-lg sm:text-xl font-bold text-amber-700 mt-1">
                  {currentInfo.metrics?.ovulation_date
                    ? formatDate(currentInfo.metrics.ovulation_date)
                    : '—'}
                </div>
                <span className="text-xs text-gray-400">Estimated peak fertility</span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Fertile Window
                </span>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {currentInfo.metrics?.fertile_window_start &&
                    `${formatDateShort(currentInfo.metrics.fertile_window_start)} – ${formatDateShort(currentInfo.metrics.fertile_window_end)}`}
                </div>
                <span className="text-xs text-emerald-600 font-medium">Approximate range</span>
              </div>
            </div>

            {/* Cycle phase horizontal progression visualizer */}
            <div className="mt-6 pt-4 border-t border-rose-100/80">
              <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-2">
                <span className={currentInfo.metrics?.current_phase === 'menstrual' ? 'text-pink-600 font-bold' : ''}>
                  1. Menstrual (Days 1–5)
                </span>
                <span className={currentInfo.metrics?.current_phase === 'follicular' ? 'text-emerald-600 font-bold' : ''}>
                  2. Follicular (Days 6–13)
                </span>
                <span className={currentInfo.metrics?.current_phase === 'ovulation' ? 'text-amber-600 font-bold' : ''}>
                  3. Ovulation (Days 14–16)
                </span>
                <span className={currentInfo.metrics?.current_phase === 'luteal' ? 'text-purple-600 font-bold' : ''}>
                  4. Luteal (Days 17–28+)
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex gap-0.5">
                <div className="bg-pink-400 h-full w-[18%]" title="Menstrual Phase" />
                <div className="bg-emerald-400 h-full w-[32%]" title="Follicular Phase" />
                <div className="bg-amber-400 h-full w-[14%]" title="Ovulation Phase" />
                <div className="bg-purple-400 h-full w-[36%]" title="Luteal Phase" />
              </div>
            </div>

            {/* Observation disclaimer */}
            <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5 italic">
              <HelpCircle className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>
                {currentInfo.disclaimer || 'Predictions are general wellness estimates and not guarantees.'}
              </span>
            </div>
          </div>
        )}

        {/* Historical Stats Grid (Phase 3) */}
        {stats && stats.total_cycles > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Cycle Length</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {stats.average_cycle_length || 28} <span className="text-xs font-normal text-gray-500">days</span>
              </div>
              <span className="text-[10px] text-gray-400">Across {stats.total_cycles} recorded cycles</span>
            </div>

            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Period Length</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {stats.average_period_length || 5} <span className="text-xs font-normal text-gray-500">days</span>
              </div>
              <span className="text-[10px] text-gray-400">Flow duration</span>
            </div>

            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Cycle Range</span>
              <div className="text-lg font-bold text-gray-900 mt-1.5">
                {stats.shortest_cycle || '—'} – {stats.longest_cycle || '—'} <span className="text-xs font-normal text-gray-500">days</span>
              </div>
              <span className="text-[10px] text-gray-400">Shortest to longest</span>
            </div>

            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Variability</span>
              <div className="text-lg font-bold text-gray-900 mt-1.5 flex items-center gap-1.5">
                <span>±{stats.cycle_variability || 0}d</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${stats.is_regular ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {stats.is_regular ? 'Regular' : 'Varied'}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">Standard deviation</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cycle Logging Form */}
          <div className="wellness-card p-6 border-rose-100 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Log Period Record</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Record start &amp; end dates to recalibrate your ML prediction.
            </p>

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
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
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
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
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
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
                  Notes / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Cramp severity, spotting, flow intensity..."
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50 transition"
              >
                {submitting ? 'Saving...' : 'Save Period Record'}
              </button>
            </form>
          </div>

          {/* Cycle History Table & List */}
          <div className="lg:col-span-2 wellness-card p-6 border-rose-100 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Cycle History &amp; Records</h2>
            <p className="text-xs text-gray-500 mb-4">
              Review, edit, or delete logged period cycles.
            </p>

            {cycles.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-rose-200" />
                <p className="text-sm">No cycle logs recorded yet.</p>
                <p className="text-xs text-gray-400">Log your first period to activate tracking.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] font-bold uppercase text-gray-400 border-b border-rose-100">
                    <tr>
                      <th className="pb-3">Start Date</th>
                      <th className="pb-3">End Date</th>
                      <th className="pb-3">Cycle</th>
                      <th className="pb-3">Flow</th>
                      <th className="pb-3">Phase</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {cycles.map((c) => (
                      <tr key={c.id} className="hover:bg-rose-50/40 transition">
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
                        <td className="py-3 text-xs text-gray-500 max-w-[120px] truncate" title={c.notes || ''}>
                          {c.notes || '—'}
                        </td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          <div className="wellness-card p-6 border-purple-100 bg-white shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
                {currentInfo.phase_guide.emoji}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentInfo.phase_guide.phase_name} Wellness Guide
                </h3>
                <p className="text-xs text-gray-500">
                  {currentInfo.phase_guide.description}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-100">
                <h4 className="font-bold text-pink-800 mb-2">🥗 Nutrition Focus</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.nutrition.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-2">🏃 Movement &amp; Exercise</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.exercise.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                <h4 className="font-bold text-purple-800 mb-2">😴 Sleep &amp; Rest</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.sleep.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <h4 className="font-bold text-amber-800 mb-2">✨ Self-Care &amp; Flow</h4>
                <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
                  {currentInfo.phase_guide.selfcare.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Edit Cycle Modal */}
        {editingCycle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setEditingCycle(null)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Cycle Entry</h3>
              <p className="text-xs text-gray-500 mb-4">Update period dates or duration.</p>

              <form onSubmit={handleUpdateCycle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cycle Length</label>
                    <input
                      type="number"
                      min="15"
                      max="60"
                      value={editCycleLength}
                      onChange={(e) => setEditCycleLength(Number(e.target.value))}
                      className="w-full p-2.5 text-sm rounded-xl border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Period Length</label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={editPeriodLength}
                      onChange={(e) => setEditPeriodLength(Number(e.target.value))}
                      className="w-full p-2.5 text-sm rounded-xl border border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCycle(null)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold wellness-gradient-btn text-white disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Update Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
