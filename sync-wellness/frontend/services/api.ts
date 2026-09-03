import api from '@/lib/api'
import { Cycle, CycleMetrics, PhaseGuide } from '@/types'

export const cycleService = {
  async getAll(): Promise<Cycle[]> {
    const res = await api.get('/api/cycles')
    return res.data
  },

  async getCurrent(): Promise<{
    has_data: boolean
    latest_cycle?: Cycle
    metrics?: CycleMetrics
    phase_guide?: PhaseGuide
    irregularity_analysis?: any
    disclaimer?: string
  }> {
    const res = await api.get('/api/cycles/current')
    return res.data
  },

  async create(data: {
    period_start: string
    period_end?: string
    cycle_length?: number
    period_length?: number
    notes?: string
  }): Promise<Cycle> {
    const res = await api.post('/api/cycles', data)
    return res.data
  },

  async update(id: number, data: Partial<Cycle>): Promise<Cycle> {
    const res = await api.put(`/api/cycles/${id}`, data)
    return res.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/cycles/${id}`)
  },
}

export const moodService = {
  async getAll() {
    const res = await api.get('/api/moods')
    return res.data
  },

  async getSummary() {
    const res = await api.get('/api/moods/summary')
    return res.data
  },

  async create(data: any) {
    const res = await api.post('/api/moods', data)
    return res.data
  },

  async update(id: number, data: any) {
    const res = await api.put(`/api/moods/${id}`, data)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/api/moods/${id}`)
  },
}

export const symptomService = {
  async getAll() {
    const res = await api.get('/api/symptoms')
    return res.data
  },

  async getAnalysis() {
    const res = await api.get('/api/symptoms/analysis')
    return res.data
  },

  async create(data: any) {
    const res = await api.post('/api/symptoms', data)
    return res.data
  },

  async update(id: number, data: any) {
    const res = await api.put(`/api/symptoms/${id}`, data)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/api/symptoms/${id}`)
  },
}

export const nutritionService = {
  async getAll() {
    const res = await api.get('/api/nutrition')
    return res.data
  },

  async getToday() {
    const res = await api.get('/api/nutrition/today')
    return res.data
  },

  async create(data: any) {
    const res = await api.post('/api/nutrition', data)
    return res.data
  },

  async update(id: number, data: any) {
    const res = await api.put(`/api/nutrition/${id}`, data)
    return res.data
  },
}

export const reminderService = {
  async getAll() {
    const res = await api.get('/api/reminders')
    return res.data
  },

  async getUpcoming() {
    const res = await api.get('/api/reminders/upcoming')
    return res.data
  },

  async create(data: any) {
    const res = await api.post('/api/reminders', data)
    return res.data
  },

  async update(id: number, data: any) {
    const res = await api.put(`/api/reminders/${id}`, data)
    return res.data
  },

  async complete(id: number) {
    const res = await api.post(`/api/reminders/${id}/complete`)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/api/reminders/${id}`)
  },
}

export const chatService = {
  async sendMessage(question: string) {
    const res = await api.post('/api/chat', { question })
    return res.data
  },

  async getHistory() {
    const res = await api.get('/api/chat/history')
    return res.data
  },

  async clearHistory() {
    await api.delete('/api/chat/history')
  },
}

export const analyticsService = {
  async getDashboard() {
    const res = await api.get('/api/analytics/dashboard')
    return res.data
  },

  async getMoodTrends(days = 30) {
    const res = await api.get(`/api/analytics/moods/trends?days=${days}`)
    return res.data
  },

  async getSymptomTrends(days = 30) {
    const res = await api.get(`/api/analytics/symptoms/trends?days=${days}`)
    return res.data
  },

  async getCycleHistory() {
    const res = await api.get('/api/analytics/cycles/history')
    return res.data
  },
}

export const aiService = {
  async getRecommendations() {
    const res = await api.get('/api/ai/recommendations')
    return res.data
  },
}

export const partnerService = {
  async getAll() {
    const res = await api.get('/api/partners')
    return res.data
  },

  async invite(data: { partner_email: string; permission_cycle?: boolean; permission_mood?: boolean; permission_profile?: boolean }) {
    const res = await api.post('/api/partners/invite', data)
    return res.data
  },

  async update(id: number, data: any) {
    const res = await api.put(`/api/partners/${id}`, data)
    return res.data
  },

  async revoke(id: number) {
    const res = await api.post(`/api/partners/${id}/revoke`)
    return res.data
  },
}

export const reportService = {
  async getAll() {
    const res = await api.get('/api/reports')
    return res.data
  },

  async generate(data: { report_type: string; title: string }) {
    const res = await api.post('/api/reports/generate', data)
    return res.data
  },

  async download(id: number) {
    const res = await api.get(`/api/reports/${id}/download`)
    return res.data
  },

  async delete(id: number) {
    await api.delete(`/api/reports/${id}`)
  },
}
