// All shared TypeScript types for SYNC frontend

export interface User {
  id: number
  name: string
  email: string
  age?: number
  height?: number
  weight?: number
  medical_conditions?: string
  avatar_url?: string
  timezone: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Cycle {
  id: number
  user_id: number
  period_start: string
  period_end?: string
  cycle_length: number
  period_length: number
  predicted_next_cycle?: string
  current_phase?: CyclePhase
  ovulation_date?: string
  fertile_window_start?: string
  fertile_window_end?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export interface CycleMetrics {
  cycle_day: number
  current_phase: CyclePhase
  ovulation_date: string
  fertile_window_start: string
  fertile_window_end: string
  predicted_next_cycle: string
  days_until_next_period: number
  cycle_length: number
  period_length: number
}

export interface CyclePrediction {
  predicted_next_period?: string
  predicted_cycle_length: number
  confidence: string
  method: string
  ovulation_date?: string
  fertile_window_start?: string
  fertile_window_end?: string
  current_phase?: string
  cycle_day?: number
  days_until_next_period?: number
  disclaimer: string
}

export interface CycleStats {
  total_cycles: number
  average_cycle_length?: number
  average_period_length?: number
  shortest_cycle?: number
  longest_cycle?: number
  cycle_variability?: number
  is_regular: boolean
  observation: string
}

export interface PhaseGuide {
  phase_name: string
  description: string
  nutrition: string[]
  exercise: string[]
  sleep: string[]
  selfcare: string[]
  productivity: string[]
  color: string
  emoji: string
}

export type MoodType =
  | 'happy'
  | 'calm'
  | 'neutral'
  | 'sad'
  | 'anxious'
  | 'irritated'
  | 'tired'
  | 'energetic'

export interface MoodLog {
  id: number
  user_id: number
  date: string
  mood: MoodType | string
  mood_score?: number
  stress_level?: number
  anxiety_level?: number
  energy_level?: number
  sleep_hours?: number
  notes?: string
  journal?: string
  sentiment_score?: number
  created_at?: string
  updated_at?: string
}

export interface MoodSummary {
  has_data: boolean
  total_entries: number
  average_mood_score?: number
  average_stress?: number
  average_anxiety?: number
  average_energy?: number
  average_sleep?: number
  dominant_mood?: string
  mood_distribution: Record<string, number>
  mood_trend: Array<{
    date: string
    mood: string
    mood_score?: number
    stress?: number
    anxiety?: number
    energy?: number
    sleep?: number
    sentiment?: number
  }>
  patterns: string[]
  recent_entries: MoodLog[]
}

export interface CycleMoodCorrelation {
  has_data: boolean
  total_correlated_entries?: number
  message?: string
  phase_correlations: Record<
    string,
    {
      entries_count: number
      avg_mood_score?: number
      avg_stress?: number
      avg_energy?: number
      avg_sleep?: number
    }
  >
  insights: string[]
  disclaimer?: string
}

export type SymptomType =
  | 'cramps'
  | 'headache'
  | 'acne'
  | 'fatigue'
  | 'bloating'
  | 'back_pain'
  | 'breast_tenderness'
  | 'nausea'
  | 'mood_swings'
  | 'insomnia'
  | 'other'

export interface Symptom {
  id: number
  user_id: number
  date: string
  symptom_type: SymptomType
  severity: number
  notes?: string
  created_at: string
}

export interface Nutrition {
  id: number
  user_id: number
  date: string
  water_intake?: number
  iron_level?: number
  hemoglobin?: number
  diet_plan?: string
  meals?: string
  notes?: string
  created_at: string
}

export type ReminderType = 'medicine' | 'water' | 'period' | 'appointment' | 'custom'

export interface Reminder {
  id: number
  user_id: number
  type: ReminderType
  title: string
  description?: string
  scheduled_time: string
  repeat: string
  completed: boolean
  created_at: string
}

export interface ChatMessage {
  id: number
  message?: string
  question?: string
  response?: string
  answer?: string
  conversation_id?: number
  sources?: string[]
  timestamp: string
}

export interface Partner {
  id: number
  user_id: number
  partner_email: string
  permission_cycle: boolean
  permission_mood: boolean
  permission_profile: boolean
  status: string
  created_at: string
}

export interface Report {
  id: number
  user_id: number
  report_type: string
  title: string
  file_url?: string
  generated_at: string
}

export interface Recommendation {
  category: string
  title: string
  suggestion: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  emoji: string
}

export interface DashboardData {
  has_cycle_data: boolean
  latest_cycle: {
    period_start?: string
    current_phase?: CyclePhase
    predicted_next_cycle?: string
    cycle_length?: number
    days_until_next?: number
  }
  mood_chart: Array<{
    date: string
    mood: MoodType
    mood_score?: number
    stress?: number
    anxiety?: number
    energy?: number
    sleep?: number
    sentiment?: number
  }>
  symptom_frequency: Record<string, number>
  water_today?: number
  upcoming_reminders: Array<{
    id: number
    title: string
    type: string
    scheduled_time: string
  }>
}
