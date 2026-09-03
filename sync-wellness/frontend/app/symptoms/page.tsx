'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { symptomService } from '@/services/api'
import { Symptom, SymptomType } from '@/types'
import {
  Activity,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import {
  SYMPTOM_LABELS,
  formatDate,
  formatDateShort,
  capitalize,
} from '@/lib/constants'

const SYMPTOMS_LIST: { type: SymptomType; label: string; emoji: string }[] = [
  { type: 'cramps', label: 'Cramps', emoji: '⚡' },
  { type: 'headache', label: 'Headache', emoji: '🤕' },
  { type: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { type: 'bloating', label: 'Bloating', emoji: '🎈' },
  { type: 'acne', label: 'Acne / Breakout', emoji: '✨' },
  { type: 'back_pain', label: 'Back Pain', emoji: '🩺' },
  { type: 'breast_tenderness', label: 'Breast Tenderness', emoji: '🌸' },
  { type: 'nausea', label: 'Nausea', emoji: '🤢' },
  { type: 'mood_swings', label: 'Mood Swings', emoji: '🎭' },
  { type: 'insomnia', label: 'Insomnia', emoji: '🌙' },
  { type: 'other', label: 'Other', emoji: '📝' },
]

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form
  const [selectedType, setSelectedType] = useState<SymptomType>('cramps')
  const [severity, setSeverity] = useState(3)
  const [notes, setNotes] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [list, an] = await Promise.all([
        symptomService.getAll(),
        symptomService.getAnalysis(),
      ])
      setSymptoms(list)
      setAnalysis(an)
    } catch (err) {
      console.error('Failed to load symptoms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await symptomService.create({
        date: logDate,
        symptom_type: selectedType,
        severity: Number(severity),
        notes: notes || undefined,
      })
      setNotes('')
      await loadData()
    } catch (err) {
      console.error('Failed to log symptom:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this symptom entry?')) return
    try {
      await symptomService.delete(id)
      await loadData()
    } catch (err) {
      console.error('Failed to delete symptom:', err)
    }
  }

  const getSeverityBadge = (sev: number) => {
    if (sev >= 4) {
      return <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">Severe ({sev}/5)</span>
    } else if (sev === 3) {
      return <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">Moderate ({sev}/5)</span>
    } else {
      return <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Mild ({sev}/5)</span>
    }
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Symptom Tracker 🩺
            </h1>
            <p className="text-sm text-gray-500">
              Log physical symptoms and monitor frequency across your cycles.
            </p>
          </div>
        </div>

        {/* Analytics Top Cards */}
        {analysis?.has_data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="wellness-card p-5 border-rose-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Most Common Symptom
              </span>
              <div className="text-xl font-bold text-gray-900 mt-1 capitalize">
                {analysis.most_common?.[0]?.[0]
                  ? SYMPTOM_LABELS[analysis.most_common[0][0]] || analysis.most_common[0][0]
                  : '—'}
              </div>
              <p className="text-xs text-rose-600 mt-0.5 font-medium">
                {analysis.most_common?.[0]?.[1] || 0} times reported
              </p>
            </div>

            <div className="wellness-card p-5 border-rose-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Total Logs
              </span>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {analysis.total_entries || 0}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Recorded overall</p>
            </div>

            <div className="wellness-card p-5 border-rose-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Pattern Insight
              </span>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Symptoms are correlated with your cycle phase in your wellness reports and dashboard.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Symptom Log Form */}
          <div className="wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Log a Symptom</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Select what you are experiencing and rate its intensity.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Symptom Picker Grid */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Symptom Type
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {SYMPTOMS_LIST.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() => setSelectedType(s.type)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition ${
                        selectedType === s.type
                          ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-xs'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span>{s.emoji}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity scale */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Severity Rating</span>
                  <span className="text-pink-600 font-bold">{severity} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>1 (Very Mild)</span>
                  <span>3 (Moderate)</span>
                  <span>5 (Severe)</span>
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
                  placeholder="e.g. Started after lunch, helped by rest..."
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Symptom'}
              </button>
            </form>
          </div>

          {/* Symptom History */}
          <div className="lg:col-span-2 wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Symptom Log History</h2>
            <p className="text-xs text-gray-500 mb-4">
              Review your entries and discuss any persistent or severe symptoms with your doctor.
            </p>

            {symptoms.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Activity className="w-10 h-10 mx-auto mb-2 text-rose-200" />
                <p className="text-sm">No symptoms logged yet.</p>
                <p className="text-xs text-gray-400">Use the form to track any discomfort.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {symptoms.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-pink-200 transition flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900 capitalize">
                          {SYMPTOM_LABELS[s.symptom_type] || s.symptom_type}
                        </span>
                        {getSeverityBadge(s.severity)}
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(s.date)}</p>
                      {s.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{s.notes}&rdquo;</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
