import { type ClassValue, clsx } from 'clsx'
import { NextRequest } from 'next/server'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractParamFromUrl(
  req: NextRequest,
  paramName: string,
): string | null {
  const url = new URL(req.url)
  return url.searchParams.get(paramName)
}

export function getDateNMinutesFromNow(minutesFromNow: number): Date {
  const MINS_FROM_MILLI = 60 * 1000 // converts minutes to milliseconds when multiplied by this factor
  return new Date(
    new Date().getTime() + Number(minutesFromNow) * MINS_FROM_MILLI,
  )
}
