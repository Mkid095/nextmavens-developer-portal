/**
 * Provisioning Progress Utilities
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STEP_LABELS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStepLabel(stepName: string): string {
  return STEP_LABELS[stepName] || stepName
}
