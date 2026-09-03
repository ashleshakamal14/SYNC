'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { reminderService } from '@/services/api'
import { Reminder, ReminderType } from '@/types'
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { REMINDER_ICONS, formatDate, capitalize } from '@/lib/constants'

const TYPES: { type: ReminderType; label: string }[] = [
  { type: 'medicine', label: 'Medicine / Supplements' },
  { type: 'water', label: 'Water Hydration' },
  { type: 'period', label: 'Period Check' },
  { type: 'appointment', label: 'Doctor Appointment' },
  { type: 'custom', label: 'Custom Reminder' },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [type, setType] = useState<ReminderType>('medicine')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [repeat, setRepeat] = useState('none')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const data = await reminderService.getAll()
      setReminders(data)
    } catch (err) {
      console.error('Failed to load reminders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Default time to next hour
    const nextHour = new Date()
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    setDateTime(nextHour.toISOString().slice(0, 16))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await reminderService.create({
        type,
        title,
        description: description || undefined,
        scheduled_time: new Date(dateTime).toISOString(),
        repeat,
      })
      setTitle('')
      setDescription('')
      await loadData()
    } catch (err) {
      console.error('Failed to create reminder:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleComplete = async (r: Reminder) => {
    try {
      if (!r.completed) {
        await reminderService.complete(r.id)
      } else {
        await reminderService.update(r.id, { completed: false })
      }
      await loadData()
    } catch (err) {
      console.error('Failed to toggle reminder status:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this reminder?')) return
    try {
      await reminderService.delete(id)
      await loadData()
    } catch (err) {
      console.error('Failed to delete reminder:', err)
    }
  }

  const upcoming = reminders.filter((r) => !r.completed)
  const completed = reminders.filter((r) => r.completed)

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Reminders &amp; Care Alerts ⏰
            </h1>
            <p className="text-sm text-gray-500">
              Timely nudges for medicines, hydration, cycle phases, and appointments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reminder Creation Form */}
          <div className="wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Create New Reminder</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Set schedules and notification intervals.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reminder Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ReminderType)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                >
                  {TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron Supplement / Drink Water"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Repeat Interval
                </label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                >
                  <option value="none">One-time only</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Take with food or a glass of citrus juice"
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Reminder'}
              </button>
            </form>
          </div>

          {/* Reminders List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active / Upcoming */}
            <div className="wellness-card p-6 border-rose-100">
              <h2 className="text-base font-bold text-gray-900 mb-1">Upcoming Reminders</h2>
              <p className="text-xs text-gray-400 mb-4">Pending health tasks</p>

              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  No active reminders scheduled.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex items-start justify-between hover:bg-white hover:border-pink-200 transition"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(r)}
                          className="mt-0.5 w-5 h-5 rounded-md border border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center text-emerald-600 transition"
                          title="Mark Complete"
                        >
                          {r.completed && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{REMINDER_ICONS[r.type] || '⏰'}</span>
                            <span className="font-bold text-sm text-gray-900">{r.title}</span>
                            <span className="text-[10px] uppercase font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                              {r.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {new Date(r.scheduled_time).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {r.repeat !== 'none' && (
                              <span className="text-purple-600 font-semibold">
                                • Repeats {r.repeat}
                              </span>
                            )}
                          </p>
                          {r.description && (
                            <p className="text-xs text-gray-600 mt-1.5">{r.description}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(r.id)}
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

            {/* Completed */}
            {completed.length > 0 && (
              <div className="wellness-card p-6 border-gray-100 opacity-80">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Completed Reminders</h3>
                <div className="space-y-2">
                  {completed.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 line-through text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{r.title}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
