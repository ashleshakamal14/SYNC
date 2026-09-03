'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { partnerService } from '@/services/api'
import { Partner } from '@/types'
import {
  Users,
  Shield,
  Plus,
  Mail,
  CheckCircle2,
  Lock,
  Trash2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { formatDate } from '@/lib/constants'

export default function PartnerPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [email, setEmail] = useState('')
  const [permissionCycle, setPermissionCycle] = useState(true)
  const [permissionMood, setPermissionMood] = useState(false)
  const [permissionProfile, setPermissionProfile] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPartners = async () => {
    try {
      const data = await partnerService.getAll()
      setPartners(data)
    } catch (err) {
      console.error('Failed to load partners:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartners()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await partnerService.invite({
        partner_email: email,
        permission_cycle: permissionCycle,
        permission_mood: permissionMood,
        permission_profile: permissionProfile,
      })
      setMessage(`Invitation sent to ${email}!`)
      setEmail('')
      await loadPartners()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePermission = async (
    id: number,
    field: 'permission_cycle' | 'permission_mood' | 'permission_profile',
    currentVal: boolean
  ) => {
    try {
      await partnerService.update(id, { [field]: !currentVal })
      await loadPartners()
    } catch (err) {
      console.error('Failed to update permission:', err)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke partner access? They will no longer see any shared data.'))
      return
    try {
      await partnerService.revoke(id)
      await loadPartners()
    } catch (err) {
      console.error('Failed to revoke partner access:', err)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Partner Mode 🤝
            </h1>
            <p className="text-sm text-gray-500">
              Selectively share cycle phase or mood with a loved one with total privacy control.
            </p>
          </div>
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Consent &amp; Zero Journal Sharing</span>
          </div>
        </div>

        {/* Privacy Highlight Card */}
        <div className="wellness-card p-6 border-rose-200 bg-gradient-to-r from-rose-50/50 via-white to-pink-50/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Your Privacy is Always First
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Private journal reflections and sensitive notes are <strong>never shared</strong> under any circumstances. You retain complete authority to grant, modify, or immediately revoke access at any time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invite Partner Form */}
          <div className="wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Invite a Partner</span>
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Send an invitation and choose what to share.
            </p>

            {message && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Partner&apos;s Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="partner@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Granular Permission Toggles */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-gray-700">
                  Select Permissions to Grant:
                </span>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Cycle Phase
                    </span>
                    <span className="text-[11px] text-gray-400">
                      View current phase (e.g. Luteal) &amp; support tips
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionCycle}
                    onChange={(e) => setPermissionCycle(e.target.checked)}
                    className="w-4 h-4 accent-pink-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Daily Mood
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Share feeling state (e.g. Tired, Energetic)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionMood}
                    onChange={(e) => setPermissionMood(e.target.checked)}
                    className="w-4 h-4 accent-pink-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      General Profile
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Share name and basic wellness preferences
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissionProfile}
                    onChange={(e) => setPermissionProfile(e.target.checked)}
                    className="w-4 h-4 accent-pink-600"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold wellness-gradient-btn shadow-md text-white disabled:opacity-50"
              >
                {submitting ? 'Sending Invite...' : 'Send Partner Invitation'}
              </button>
            </form>
          </div>

          {/* Active Partners List */}
          <div className="lg:col-span-2 wellness-card p-6 border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Active Partners</h2>
            <p className="text-xs text-gray-500 mb-4">
              Manage ongoing connections and change visibility toggles in real-time.
            </p>

            {partners.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-rose-200" />
                <p className="text-sm">No partners invited yet.</p>
                <p className="text-xs text-gray-400">
                  Invite your partner to help them understand and support your rhythm.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-white hover:border-pink-200 transition space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-gray-900">
                          {p.partner_email}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              p.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            Invited {formatDate(p.created_at)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevoke(p.id)}
                        className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold transition"
                      >
                        Revoke Access
                      </button>
                    </div>

                    {/* Permissions checklist */}
                    <div className="pt-3 border-t border-rose-100/60 flex flex-wrap gap-4 text-xs">
                      <button
                        onClick={() =>
                          handleTogglePermission(p.id, 'permission_cycle', p.permission_cycle)
                        }
                        className={`px-3 py-1.5 rounded-lg border transition ${
                          p.permission_cycle
                            ? 'bg-pink-50 border-pink-300 text-pink-700 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        Cycle: {p.permission_cycle ? 'Shared ✓' : 'Hidden ✕'}
                      </button>

                      <button
                        onClick={() =>
                          handleTogglePermission(p.id, 'permission_mood', p.permission_mood)
                        }
                        className={`px-3 py-1.5 rounded-lg border transition ${
                          p.permission_mood
                            ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        Mood: {p.permission_mood ? 'Shared ✓' : 'Hidden ✕'}
                      </button>

                      <button
                        onClick={() =>
                          handleTogglePermission(p.id, 'permission_profile', p.permission_profile)
                        }
                        className={`px-3 py-1.5 rounded-lg border transition ${
                          p.permission_profile
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                      >
                        Profile: {p.permission_profile ? 'Shared ✓' : 'Hidden ✕'}
                      </button>
                    </div>
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
