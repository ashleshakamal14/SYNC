import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function DisclaimerBanner() {
  return (
    <div className="bg-rose-50/80 border border-rose-200/70 text-rose-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 mb-6">
      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
      <span>
        <strong>Medical Disclaimer:</strong> SYNC provides general wellness information and is not a substitute for professional medical advice, diagnosis, or treatment.
      </span>
    </div>
  )
}
