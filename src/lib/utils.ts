import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely format a date for database storage without timezone issues
 * Ensures the date remains the same regardless of timezone
 */
export function formatDateForDB(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Get local date components to avoid timezone conversion
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Get today's date formatted for database storage
 */
export function getTodayForDB(): string {
  return formatDateForDB(new Date())
}

/**
 * Parse a date string from database without timezone issues
 * Treats the date as already being in local timezone
 */
export function parseDateFromDB(dateString: string): Date {
  // Create date by parsing components directly to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed
}
