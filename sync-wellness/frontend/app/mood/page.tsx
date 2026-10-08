'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { moodService, analyticsService } from '@/services/api'
import { MoodLog, MoodType, MoodSummary, CycleMoodCorrelation } from '@/types'
import {
  Smile,
  Heart,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  BookOpen,
  Calendar,
  Moon,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle2,
  X,
  Filter,
} from 'lucide-react'
import {
  MOOD_EMOJIS,
  MOOD_COLORS,
  formatDate,
  formatDateShort,
  capitalize,
} from '@/lib/constants'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

const MOODS: MoodType[] = [
  'happy',
  'calm',
  'energetic',
  'neutral',
  'tired',
  'sad',
  'anxious',
  'irritated',
]

export default function MoodPage() {
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [summary, setSummary] = useState<MoodSummary | null>(null)
  const [correlations, setCorrelations] = useState<CycleMoodCorrelation | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterDays, setFilterDays] = useState<number | undefined>(undefined) // undefined = all

  // Form states (Add)
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy')
  const [moodScore, setMoodScore] = useState(8)
  const [stressLevel, setStressLevel] = useState(3)
  const [anxietyLevel, setAnxietyLevel] = useState(2)
  const [energyLevel, setEnergyLevel] = useState(7)
  const [sleepHours, setSleepHours] = useState(7.5)
  const [journal, setJournal] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Edit states
  const [editingLog, setEditingLog] = useState<MoodLog | null>(null)
  const [editMood, setEditMood] = useState<MoodType>('happy')
  const [editMoodScore, setEditMoodScore] = useState(8)
  const [editStress, setEditStress] = useState(3)
  const [editAnxiety, setEditAnxiety] = useState(2)
  const [editEnergy, setEditEnergy] = useState(7)
  const [editSleep, setEditSleep] = useState(7.5)
  const [editJournal, setEditJournal] = useState('')
  const [updating, setUpdating] = useState(false)

  const loadMoodData = async (days?: number) => {
    try {
      const [allLogs, sum, corr] = await Promise.all([
        moodService.getAll(days ? { days } : undefined),
        moodService.getSummary(days ? { days } : undefined),
        analyticsService.getCorrelations().catch(() => null),
      ])
      setLogs(allLogs)
      setSummary(sum)
      setCorrelations(corr)
    } catch (err) {
      console.error('Failed to load mood logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMoodData(filterDays)
  }, [filterDays])

  const handleFilterChange = (days?: number) => {
    setFilterDays(days)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await moodService.create({
        date: logDate,
        mood: selectedMood,
        mood_score: Number(moodScore),
        stress_level: Number(stressLevel),
        anxiety_level: Number(anxietyLevel),
        energy_level: Number(energyLevel),
        sleep_hours: Number(sleepHours),
        journal: journal || undefined,
        notes: journal || undefined,
      })
      setJournal('')
      setSuccessMsg('Mood entry logged successfully!')
      setTimeout(() => setSuccessMsg(null), 4000)
      await loadMoodData(filterDays)
    } catch (err) {
      console.error('Error logging mood:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (l: MoodLog) => {
    setEditingLog(l)
    setEditMood((l.mood as MoodType) || 'happy')
    setEditMoodScore(l.mood_score || 7)
    setEditStress(l.stress_level || 3)
    setEditAnxiety(l.anxiety_level || 2)
    setEditEnergy(l.energy_level || 7)
    setEditSleep(l.sleep_hours || 7.5)
    setEditJournal(l.notes || l.journal || '')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return
    setUpdating(true)
    try {
      await moodService.update(editingLog.id, {
        mood: editMood,
        mood_score: Number(editMoodScore),
        stress_level: Number(editStress),
        anxiety_level: Number(editAnxiety),
        energy_level: Number(editEnergy),
        sleep_hours: Number(editSleep),
        notes: editJournal || undefined,
        journal: editJournal || undefined,
      })
      setEditingLog(null)
      await loadMoodData(filterDays)
    } catch (err) {
      console.error('Failed to update mood entry:', err)
      alert('Failed to update mood entry.')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mood entry?')) return
    try {
      await moodService.delete(id)
      await loadMoodData(filterDays)
    } catch (err) {
      console.error('Failed to delete mood log:', err)
    }
  }

  const chartData = [...logs]
    .reverse()
    .slice(-20)
    .map((l) => ({
      date: l.date,
      energy: l.energy_level,
      stress: l.stress_level,
      anxiety: l.anxiety_level,
      sleep: l.sleep_hours,
      mood_score: l.mood_score,
      sentiment: l.sentiment_score ? Math.round(l.sentiment_score * 10) : undefined,
    }))

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Mood &amp; Emotional Wellness 😊
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Daily emotional check-ins, stress, anxiety, sleep logs, and AI pattern trends.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-medium shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Sentiment &amp; Pattern Engine</span>
            </span>
          </div>
        </div>

        {/* Summary Metric Cards (Phase 4) */}
        {summary && summary.has_data && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Mood Score</span>
              <div className="text-2xl font-extrabold text-pink-600 mt-1">
                {summary.average_mood_score || '—'} <span className="text-xs text-gray-400 font-normal">/ 10</span>
              </div>
              <span className="text-[10px] text-gray-400 capitalize">Dominant: {summary.dominant_mood || 'Balanced'}</span>
            </div>

            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Stress</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {summary.average_stress || '—'} <span className="text-xs text-gray-400 font-normal">/ 10</span>
              </div>
              <span className="text-[10px] text-gray-400">Tension level</span>
            </div>

            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Anxiety</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {summary.average_anxiety || '—'} <span className="text-xs text-gray-400 font-normal">/ 10</span>
              </div>
              <span className="text-[10px] text-gray-400">Restlessness</span>
            </div>

            <div className="wellness-card p-4">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Energy</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {summary.average_energy || '—'} <span className="text-xs text-gray-400 font-normal">/ 10</span>
              </div>
              <span className="text-[10px] text-gray-400">Vitality</span>
            </div>

            <div className="wellness-card p-4 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase text-gray-400">Avg Sleep</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {summary.average_sleep || '—'} <span className="text-xs text-gray-400 font-normal">hrs</span>
              </div>
              <span className="text-[10px] text-gray-400">Rest duration</span>
            </div>
          </div>
        )}

        {/* AI Patterns & Cycle+Mood Correlation Banner (Phases 4 & 5) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Emotional Patterns */}
          {summary?.patterns && summary.patterns.length > 0 && (
            <div className="wellness-card p-5 border-purple-200 bg-gradient-to-r from-purple-50/60 via-white to-pink-50/40 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>AI Emotional Observations</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {summary.patterns.map((p: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Phase 5: Cycle + Mood Correlation Insights */}
          {correlations?.insights && correlations.insights.length > 0 && (
            <div className="wellness-card p-5 border-rose-200 bg-gradient-to-r from-rose-50/60 via-white to-amber-50/40 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2.5 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>Cycle + Mood Phase Correlation</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {correlations.insights.map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
              <span className="text-[10px] text-gray-400 block mt-2 italic">
                {correlations.disclaimer}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mood Logging Form */}
          <div className="wellness-card p-6 border-rose-100 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Log Today&apos;s Mood</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Record emotions, stress, anxiety, energy, and sleep.
            </p>

            {successMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

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

              {/* Mood selector buttons */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Dominant Mood
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMood(m)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                        selectedMood === m
                          ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-xs scale-105'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{MOOD_EMOJIS[m]}</span>
                      <span className="text-[10px] capitalize">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood score slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Overall Mood Score</span>
                  <span className="text-pink-600 font-bold">{moodScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodScore}
                  onChange={(e) => setMoodScore(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Low (1)</span>
                  <span>Euphoric (10)</span>
                </div>
              </div>

              {/* Stress Level slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Stress Level</span>
                  <span className="text-rose-600 font-bold">{stressLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Relaxed (1)</span>
                  <span>Severe (10)</span>
                </div>
              </div>

              {/* Anxiety Level slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Anxiety Level</span>
                  <span className="text-amber-600 font-bold">{anxietyLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={anxietyLevel}
                  onChange={(e) => setAnxietyLevel(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Serene (1)</span>
                  <span>High Tension (10)</span>
                </div>
              </div>

              {/* Energy Level slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Energy Level</span>
                  <span className="text-emerald-600 font-bold">{energyLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Fatigued (1)</span>
                  <span>High Energy (10)</span>
                </div>
              </div>

              {/* Sleep Hours */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sleep Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Private Journal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Private Journal &amp; Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="What influenced your mood or feelings today?"
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50 transition"
              >
                {submitting ? 'Saving...' : 'Save Mood Check-in'}
              </button>
            </form>
          </div>

          {/* Mood Trends & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter Pills Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                <Filter className="w-3.5 h-3.5 text-pink-600" />
                <span>Filter Logs:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange(undefined)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filterDays === undefined
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => handleFilterChange(30)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filterDays === 30
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleFilterChange(7)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    filterDays === 7
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Last 7 Days
                </button>
              </div>
            </div>

            {/* Multi-metric Chart */}
            <div className="wellness-card p-6 border-rose-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Emotional Wellness Trend
                  </h2>
                  <p className="text-xs text-gray-400">Energy, Stress, Anxiety, and Sleep</p>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        name="Energy (1-10)"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="stress"
                        name="Stress (1-10)"
                        stroke="#EC4899"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        name="Anxiety (1-10)"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                      />
                      <Line
                        type="monotone"
                        dataKey="sleep"
                        name="Sleep (hrs)"
                        stroke="#6366F1"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-8 text-center">
                  Log mood entries to visualize emotional and wellness trends.
                </p>
              )}
            </div>

            {/* History Feed */}
            <div className="wellness-card p-6 border-rose-100 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Logged Mood Entries ({logs.length})
              </h3>

              {logs.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  No mood logs found for this filter.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.slice(0, 15).map((l) => (
                    <div
                      key={l.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-pink-200 transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{MOOD_EMOJIS[l.mood as MoodType] || '🌸'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 capitalize">
                                {l.mood}
                              </span>
                              {l.mood_score && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-pink-100 text-pink-700 font-bold rounded-md">
                                  Score: {l.mood_score}/10
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 block">
                              {formatDate(l.date)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-[11px] space-y-0.5">
                            <span className="text-rose-600 font-semibold block">
                              Stress: {l.stress_level ?? '—'}/10 • Anx: {l.anxiety_level ?? '—'}/10
                            </span>
                            <span className="text-emerald-600 font-semibold block">
                              Energy: {l.energy_level ?? '—'}/10 • Sleep: {l.sleep_hours ?? '—'}h
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(l)}
                              className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(l.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {(l.notes || l.journal) && (
                        <p className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100 italic mt-2">
                          &ldquo;{l.notes || l.journal}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Mood Modal */}
        {editingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setEditingLog(null)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Mood Entry</h3>
              <p className="text-xs text-gray-500 mb-4">{formatDate(editingLog.date)}</p>

              <form onSubmit={handleUpdate} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mood</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEditMood(m)}
                        className={`p-1.5 rounded-lg border text-center text-xs capitalize ${
                          editMood === m ? 'border-pink-500 bg-pink-50 font-bold text-pink-700' : 'border-gray-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mood Score ({editMoodScore})</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editMoodScore}
                      onChange={(e) => setEditMoodScore(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stress ({editStress})</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editStress}
                      onChange={(e) => setEditStress(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Anxiety ({editAnxiety})</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editAnxiety}
                      onChange={(e) => setEditAnxiety(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Energy ({editEnergy})</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editEnergy}
                      onChange={(e) => setEditEnergy(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={editSleep}
                    onChange={(e) => setEditSleep(Number(e.target.value))}
                    className="w-full p-2 text-sm rounded-xl border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editJournal}
                    onChange={(e) => setEditJournal(e.target.value)}
                    className="w-full p-2 text-sm rounded-xl border border-gray-200"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLog(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold wellness-gradient-btn text-white disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Update Entry'}
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
