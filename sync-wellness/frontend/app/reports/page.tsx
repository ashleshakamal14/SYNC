'use client'
import React, { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { reportService, analyticsService } from '@/services/api'
import { Report } from '@/types'
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { formatDate, formatDateShort } from '@/lib/constants'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [cycleData, setCycleData] = useState<any[]>([])
  const [moodTrends, setMoodTrends] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Report generation state
  const [reportType, setReportType] = useState('monthly')
  const [title, setTitle] = useState('Monthly Wellness Summary')
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [rList, cHist, mTrends] = await Promise.all([
        reportService.getAll(),
        analyticsService.getCycleHistory(),
        analyticsService.getMoodTrends(30),
      ])
      setReports(rList)
      setCycleData(cHist.data || [])
      setMoodTrends(mTrends)
    } catch (err) {
      console.error('Failed to load reports & analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setMessage(null)

    try {
      await reportService.generate({
        report_type: reportType,
        title,
      })
      setMessage('Wellness report PDF generated successfully!')
      await loadData()
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async (id: number) => {
  try {
    await reportService.download(id)
  } catch (err) {
    console.error('Failed to download report:', err)
    alert('Failed to download report')
  }
}
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this saved report?')) return
    try {
      await reportService.delete(id)
      await loadData()
    } catch (err) {
      console.error('Failed to delete report:', err)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Reports &amp; Analytics 📊
            </h1>
            <p className="text-sm text-gray-500">
              Visual wellness trends and downloadable summary reports for your healthcare visits.
            </p>
          </div>
        </div>

        {/* Generate Report Form */}
        <div className="wellness-card p-6 border-pink-100 bg-gradient-to-r from-rose-50/50 via-white to-purple-50/40">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-600" />
              <span>Generate New Wellness Report</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Compile your logged cycles, symptoms, and mood entries into an organized PDF.
            </p>

            {message && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Report Scope
                </label>
                <select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value)
                    setTitle(
                      e.target.value === 'cycle'
                        ? 'Menstrual Cycle History Report'
                        : e.target.value === 'mood'
                        ? 'Emotional Wellness & Mood Report'
                        : 'Comprehensive Monthly Wellness Report'
                    )
                  }}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-pink-500"
                >
                  <option value="monthly">Monthly Wellness (All Data)</option>
                  <option value="cycle">Cycle &amp; Period History</option>
                  <option value="mood">Mood &amp; Stress Trend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold wellness-gradient-btn text-white shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>{generating ? 'Generating PDF...' : 'Create Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cycle Length Variance Chart */}
          <div className="wellness-card p-6 border-rose-100">
            <h3 className="font-bold text-sm text-gray-900 mb-1">Cycle Length Variations</h3>
            <p className="text-xs text-gray-400 mb-4">Last 12 recorded periods (Days)</p>

            {cycleData.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cycleData}>
                    <XAxis
                      dataKey="start"
                      tickFormatter={(val) => formatDateShort(val)}
                      fontSize={11}
                      stroke="#9CA3AF"
                    />
                    <YAxis domain={[20, 40]} fontSize={11} stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #FBCFE8',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="cycle_length"
                      name="Cycle Length (Days)"
                      fill="#EC4899"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-12 text-center">
                Log at least one period to view cycle variance charts.
              </p>
            )}
          </div>

          {/* Mood Distribution */}
          <div className="wellness-card p-6 border-rose-100">
            <h3 className="font-bold text-sm text-gray-900 mb-1">
              Monthly Mood Breakdown
            </h3>
            <p className="text-xs text-gray-400 mb-4">Past 30 days distribution</p>

            {moodTrends?.distribution && Object.keys(moodTrends.distribution).length > 0 ? (
              <div className="space-y-3 pt-2">
                {Object.entries(moodTrends.distribution).map(([m, cnt]: [string, any]) => (
                  <div key={m} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 capitalize">{m}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-36 sm:w-52 bg-purple-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (cnt / 15) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-500 font-bold w-4 text-right">{cnt}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic py-12 text-center">
                Log moods to see your emotional distribution.
              </p>
            )}
          </div>
        </div>

        {/* Generated Reports List */}
        <div className="wellness-card p-6 border-rose-100">
          <h3 className="text-base font-bold text-gray-900 mb-1">Saved Reports</h3>
          <p className="text-xs text-gray-400 mb-4">Download or review previously generated PDFs</p>

          {reports.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">
              No reports generated yet. Click &ldquo;Create Report&rdquo; above to generate your first PDF summary.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-pink-200 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-400">
                        Generated {formatDate(r.generated_at)} • Scope: {r.report_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(r.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-pink-700 hover:bg-pink-50 flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
