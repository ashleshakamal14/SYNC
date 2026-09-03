'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import {
  User,
  Mail,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Heart,
} from 'lucide-react'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [conditions, setConditions] = useState('')
  const [timezone, setTimezone] = useState('UTC')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setAge(user.age?.toString() || '')
      setHeight(user.height?.toString() || '')
      setWeight(user.weight?.toString() || '')
      setConditions(user.medical_conditions || '')
      setTimezone(user.timezone || 'UTC')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(null)
    setError(null)

    try {
      const res = await api.put('/api/auth/profile', {
        name,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        medical_conditions: conditions || null,
        timezone,
      })
      updateUser(res.data)
      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Personal Profile &amp; Settings 👤
          </h1>
          <p className="text-sm text-gray-500">
            Manage your personal metrics to tailor recommendations.
          </p>
        </div>

        <div className="wellness-card p-6 sm:p-8 border-rose-100">
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="12"
                  max="120"
                  placeholder="28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="58"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Known Medical Conditions / Allergies (Optional)
              </label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Mild iron deficiency, lactose sensitivity, thyroid condition..."
                className="w-full p-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
              />
              <span className="text-[10px] text-gray-400">
                Helps tailor general recommendations. Never replaces your doctor&apos;s records.
              </span>
            </div>

            <div className="pt-4 border-t border-rose-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold wellness-gradient-btn text-white shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
