'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { moodService } from '@/services/api'
import { MoodLog, MoodType } from '@/types'
import {
  Smile,
  Heart,
  Sparkles,
  Plus,
  Trash2,
  TrendingUp,
  BookOpen,
  Calendar,
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
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy')
  const [stressLevel, setStressLevel] = useState(3)
  const [energyLevel, setEnergyLevel] = useState(7)
  const [journal, setJournal] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  const loadMoodData = async () => {
    try {
      const [allLogs, sum] = await Promise.all([
        moodService.getAll(),
        moodService.getSummary(),
      ])
      setLogs(allLogs)
      setSummary(sum)
    } catch (err) {
      console.error('Failed to load mood logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMoodData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await moodService.create({
        date: logDate,
        mood: selectedMood,
        stress_level: Number(stressLevel),
        energy_level: Number(energyLevel),
        journal: journal || undefined,
      })
      setJournal('')
      await loadMoodData()
    } catch (err) {
      console.error('Error logging mood:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mood entry?')) return
    try {
      await moodService.delete(id)
      await loadMoodData()
    } catch (err) {
      console.error('Failed to delete mood log:', err)
    }
  }

  const chartData = [...logs]
    .reverse()
    .slice(-14)
    .map((l) => ({
      date: l.date,
      energy: l.energy_level,
      stress: l.stress_level,
      sentiment: l.sentiment_score ? Math.round(l.sentiment_score * 10) : 0,
    }))

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Mood &amp; Emotional Wellness 😊
            </h1>
            <p className="text-sm text-gray-500">
              Daily check-ins, journal reflections, and AI sentiment trends.
            </p>
          </div>
          <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Sentiment &amp; Pattern Detection</span>
          </div>
        </div>

        {/* AI Patterns & Observations Banner */}
        {summary?.patterns && summary.patterns.length > 0 && (
          <div className="wellness-card p-5 border-purple-200 bg-gradient-to-r from-purple-50/60 via-white to-pink-50/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mood Logging Form */}
          <div className="wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Log Today&apos;s Mood</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              How are you feeling mentally and physically today?
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
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                        selectedMood === m
                          ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold shadow-xs scale-105'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="text-xl mb-1">{MOOD_EMOJIS[m]}</span>
                      <span className="text-[10px] capitalize">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress Level slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Stress Level</span>
                  <span className="text-pink-600">{stressLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Calm (1)</span>
                  <span>High Stress (10)</span>
                </div>
              </div>

              {/* Energy Level slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Energy Level</span>
                  <span className="text-emerald-600">{energyLevel} / 10</span>
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
                  <span>Exhausted (1)</span>
                  <span>Vibrant (10)</span>
                </div>
              </div>

              {/* Journal Entry */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Private Journal (Optional)
                </label>
                <textarea
                  rows={3}
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="Reflect on your day, thoughts, or what contributed to your feelings..."
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
                <span className="text-[10px] text-gray-400">
                  Sentiment score is calculated automatically from your reflections.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Mood Entry'}
              </button>
            </form>
          </div>

          {/* Mood Trends & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="wellness-card p-6 border-rose-100">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                Stress vs Energy Trend
              </h2>
              <p className="text-xs text-gray-400 mb-4">Past 14 entries</p>

              {chartData.length > 0 ? (
                <div className="h-56 w-full">
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
                      <Line
                        type="monotone"
                        dataKey="energy"
                        name="Energy"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="stress"
                        name="Stress"
                        stroke="#EC4899"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-8 text-center">
                  Log entries to view your emotional patterns.
                </p>
              )}
            </div>

            {/* History Feed */}
            <div className="wellness-card p-6 border-rose-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Recent Journal &amp; Mood Entries
              </h3>

              {logs.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  No mood logs recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.slice(0, 10).map((l) => (
                    <div
                      key={l.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-pink-200 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{MOOD_EMOJIS[l.mood]}</span>
                          <div>
                            <span className="text-sm font-bold text-gray-900 capitalize">
                              {l.mood}
                            </span>
                            <span className="text-xs text-gray-400 block">
                              {formatDate(l.date)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <span className="text-rose-600 font-semibold block">
                              Stress: {l.stress_level || '—'}/10
                            </span>
                            <span className="text-emerald-600 font-semibold block">
                              Energy: {l.energy_level || '—'}/10
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {l.journal && (
                        <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-100 italic mt-2">
                          &ldquo;{l.journal}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
