'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { nutritionService } from '@/services/api'
import { Nutrition } from '@/types'
import {
  Apple,
  Droplets,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { formatDate } from '@/lib/constants'

export default function NutritionPage() {
  const [logs, setLogs] = useState<Nutrition[]>([])
  const [todayLog, setTodayLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form
  const [waterIntake, setWaterIntake] = useState(2.0)
  const [ironLevel, setIronLevel] = useState('')
  const [hemoglobin, setHemoglobin] = useState('')
  const [dietPlan, setDietPlan] = useState('omnivore')
  const [notes, setNotes] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [all, today] = await Promise.all([
        nutritionService.getAll(),
        nutritionService.getToday(),
      ])
      setLogs(all)
      setTodayLog(today)
    } catch (err) {
      console.error('Failed to load nutrition data:', err)
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
    setSuccessMsg(null)

    try {
      await nutritionService.create({
        date: logDate,
        water_intake: Number(waterIntake),
        iron_level: ironLevel ? parseFloat(ironLevel) : undefined,
        hemoglobin: hemoglobin ? parseFloat(hemoglobin) : undefined,
        diet_plan: dietPlan,
        notes: notes || undefined,
      })
      setSuccessMsg('Nutrition log saved successfully!')
      setNotes('')
      await loadData()
    } catch (err) {
      console.error('Failed to save nutrition log:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const addWaterQuick = async (amount: number) => {
    const current = todayLog?.log?.water_intake || 0
    const newTotal = Math.round((current + amount) * 10) / 10
    setWaterIntake(newTotal)

    try {
      await nutritionService.create({
        date: new Date().toISOString().split('T')[0],
        water_intake: newTotal,
      })
      await loadData()
    } catch (err) {
      console.error('Failed to update water:', err)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Nutrition &amp; Hydration 🥗
            </h1>
            <p className="text-sm text-gray-500">
              Track your water intake, diet balance, and general wellness habits.
            </p>
          </div>
        </div>

        {/* Medical disclaimer note on lab values */}
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Lab Values Note:</strong> If you record iron or hemoglobin values, please note that SYNC does not diagnose nutrient deficiencies. Lab interpretations should always be confirmed with your doctor or a qualified healthcare provider.
          </span>
        </div>

        {/* Quick Water Tracker Widget */}
        <div className="wellness-card p-6 border-blue-100 bg-gradient-to-r from-blue-50/50 via-white to-cyan-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 mb-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>Today&apos;s Hydration Goal</span>
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {todayLog?.log?.water_intake || 0}
                </span>
                <span className="text-sm text-gray-500">/ 2.5 Liters Goal</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => addWaterQuick(0.25)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
              >
                + 250 ml (Glass)
              </button>
              <button
                onClick={() => addWaterQuick(0.5)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition shadow-xs"
              >
                + 500 ml (Bottle)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Nutrition Log Form */}
          <div className="wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Log Daily Nutrition</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Record meals, preferences, and water levels.
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

              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>Water Intake (Liters)</span>
                  <span className="text-blue-600 font-bold">{waterIntake} L</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={waterIntake}
                  onChange={(e) => setWaterIntake(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dietary Preference
                </label>
                <select
                  value={dietPlan}
                  onChange={(e) => setDietPlan(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                >
                  <option value="omnivore">Balanced / Omnivore</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Keto / Low-Carb</option>
                  <option value="gluten_free">Gluten-Free</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Iron (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.2"
                    value={ironLevel}
                    onChange={(e) => setIronLevel(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Hemoglobin (Opt.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 13.5"
                    value={hemoglobin}
                    onChange={(e) => setHemoglobin(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Meals &amp; Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Oats with seeds for breakfast, lentil soup for dinner..."
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Nutrition Log'}
              </button>
            </form>
          </div>

          {/* Nutrition Tips & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Wellness Food Suggestions */}
            <div className="wellness-card p-6 border-emerald-100 bg-white">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Cycle-Supportive Foods</span>
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                General wellness suggestions for vitality across your monthly rhythm.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="font-bold text-emerald-800 block mb-1">🥬 Iron Support</span>
                  <p className="text-gray-600 leading-relaxed">
                    Lentils, spinach, pumpkin seeds, and fortified grains replenish mineral stores. Pair with citrus for optimal absorption.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <span className="font-bold text-purple-800 block mb-1">🍫 Magnesium Support</span>
                  <p className="text-gray-600 leading-relaxed">
                    Dark chocolate (70%+), almonds, avocados, and whole grains support muscle relaxation and restful sleep.
                  </p>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="wellness-card p-6 border-rose-100">
              <h3 className="text-base font-bold text-gray-900 mb-4">Recent Nutrition Logs</h3>

              {logs.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-6 text-center">
                  No nutrition records yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{formatDate(n.date)}</span>
                          <span className="capitalize text-gray-500">
                            • {n.diet_plan || 'Omnivore'}
                          </span>
                        </div>
                        {n.notes && <p className="text-gray-600 mt-1 italic">&ldquo;{n.notes}&rdquo;</p>}
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-blue-600 block">
                          💧 {n.water_intake || 0} L
                        </span>
                        {(n.iron_level || n.hemoglobin) && (
                          <span className="text-[10px] text-gray-400">
                            Fe: {n.iron_level ?? '—'} | Hb: {n.hemoglobin ?? '—'}
                          </span>
                        )}
                      </div>
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
