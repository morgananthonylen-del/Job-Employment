import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(
  input?: string | number | Date | null | undefined
): string {
  if (input === null || input === undefined) {
    return "Just now"
  }

  const date =
    typeof input === "string" || typeof input === "number" ? new Date(input) : input

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Just now"
  }

  const now = Date.now()
  const diff = now - date.getTime() // Always positive for past dates
  const absDiff = Math.abs(diff)

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  if (absDiff < minute) {
    return "Just now"
  }

  const formatUnit = (value: number, unit: string) => {
    const rounded = Math.floor(value)
    if (rounded <= 0) {
      return "Just now"
    }
    const plural = rounded === 1 ? unit : `${unit}s`
    return `${rounded} ${plural} ago`
  }

  if (absDiff < hour) {
    return formatUnit(absDiff / minute, "minute")
  }

  if (absDiff < day) {
    return formatUnit(absDiff / hour, "hour")
  }

  if (absDiff < week) {
    return formatUnit(absDiff / day, "day")
  }

  if (absDiff < month) {
    return formatUnit(absDiff / week, "week")
  }

  if (absDiff < year) {
    return formatUnit(absDiff / month, "month")
  }

  return formatUnit(absDiff / year, "year")
}