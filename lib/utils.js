import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format video duration (seconds) as M:SS or H:MM:SS */
export function formatVideoDuration(seconds) {
  const n = Number(seconds)
  if (Number.isNaN(n) || n < 0) return ''
  const h = Math.floor(n / 3600)
  const m = Math.floor((n % 3600) / 60)
  const s = Math.floor(n % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Format total seconds as course duration string e.g. "2h 30m" or "1 hour" */
export function formatCourseDuration(totalSeconds) {
  const n = Math.floor(Number(totalSeconds) || 0)
  if (n <= 0) return '0 hours'
  const hours = Math.floor(n / 3600)
  const minutes = Math.floor((n % 3600) / 60)
  if (hours === 0) return minutes === 1 ? '1 minute' : `${minutes} minutes`
  if (minutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`
  return `${hours}h ${minutes}m`
}
