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
  created_at: string
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
  mood: MoodType
  stress_level?: number
  energy_level?: number
  journal?: string
  sentiment_score?: number
  created_at: string
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
  question: string
  answer: string
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
    stress?: number
    energy?: number
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
