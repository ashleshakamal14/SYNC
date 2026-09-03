import { CyclePhase, MoodType } from '@/types'

export const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: '#E91E8C',
  follicular: '#4CAF50',
  ovulation: '#FF9800',
  luteal: '#9C27B0',
}

export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulation',
  luteal: 'Luteal',
}

export const PHASE_EMOJIS: Record<CyclePhase, string> = {
  menstrual: '🌙',
  follicular: '🌱',
  ovulation: '☀️',
  luteal: '🌸',
}

export const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  neutral: '😐',
  sad: '😢',
  anxious: '😰',
  irritated: '😤',
  tired: '😴',
  energetic: '⚡',
}

export const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#4CAF50',
  calm: '#2196F3',
  neutral: '#9E9E9E',
  sad: '#3F51B5',
  anxious: '#FF5722',
  irritated: '#F44336',
  tired: '#795548',
  energetic: '#FF9800',
}

export const SYMPTOM_LABELS: Record<string, string> = {
  cramps: 'Cramps',
  headache: 'Headache',
  acne: 'Acne',
  fatigue: 'Fatigue',
  bloating: 'Bloating',
  back_pain: 'Back Pain',
  breast_tenderness: 'Breast Tenderness',
  nausea: 'Nausea',
  mood_swings: 'Mood Swings',
  insomnia: 'Insomnia',
  other: 'Other',
}

export const REMINDER_ICONS: Record<string, string> = {
  medicine: '💊',
  water: '💧',
  period: '🩸',
  appointment: '🏥',
  custom: '⏰',
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}
