import React from 'react'
import { CyclePhase } from '@/types'
import { PHASE_LABELS, PHASE_EMOJIS } from '@/lib/constants'

interface PhaseBadgeProps {
  phase?: CyclePhase | string
  className?: string
}

export default function PhaseBadge({ phase, className = '' }: PhaseBadgeProps) {
  if (!phase) return null

  const p = phase.toLowerCase() as CyclePhase
  const badgeClass =
    p === 'menstrual'
      ? 'badge-phase-menstrual'
      : p === 'follicular'
      ? 'badge-phase-follicular'
      : p === 'ovulation'
      ? 'badge-phase-ovulation'
      : 'badge-phase-luteal'

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeClass} ${className}`}
    >
      <span>{PHASE_EMOJIS[p] || '🌸'}</span>
      <span>{PHASE_LABELS[p] || phase}</span>
    </span>
  )
}
