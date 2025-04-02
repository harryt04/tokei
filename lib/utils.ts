import { type ClassValue, clsx } from 'clsx'
import { NextRequest } from 'next/server'
import { twMerge } from 'tailwind-merge'
import { Howl } from 'howler'
import { Routine, RoutineSwimLane } from '@/models'

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

export function getDateGivenTimeOfDay(timeOfDay: string): Date {
  const [hours, minutes] = timeOfDay.split(':').map(Number)
  const now = new Date()
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  )
}

export const speakText = (text: string): void => {
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  speechSynthesis.speak(utterance)
}

export const playCustomAlarm = (audioUrl = 'default-alarm.wav') => {
  const sound = new Howl({
    src: [audioUrl],
  })
  sound.play()
  return sound
}

/**
 * Calculates the total run times for each swim lane in a routine.
 *
 * @param swimLanes - An array of `RoutineSwimLane` objects, where each swim lane
 * contains a series of steps with their respective durations.
 * @returns A record where the keys are swim lane IDs and the values are the total
 * duration (in seconds) of all steps in the corresponding swim lane.
 */
export function calculateSwimLaneRunTimes(
  swimLanes: RoutineSwimLane[],
): Record<string, number> {
  const swimLaneRunTimes: Record<string, number> = {}
  swimLanes?.forEach((swimLane) => {
    const totalDuration = swimLane.steps.reduce(
      (sum, step) => sum + step.durationInSeconds,
      0,
    )
    swimLaneRunTimes[swimLane.id] = totalDuration
  })
  return swimLaneRunTimes
}

/**
 * Calculates the completion time of a routine if started now.
 * @param routine The routine object.
 * @returns A Date object representing when the routine will complete.
 */
export function getCompletionTime(routine: Routine): Date {
  const totalDurationInSeconds =
    routine.swimLanes?.reduce(
      (total, swimLane) =>
        total +
        swimLane.steps.reduce((sum, step) => sum + step.durationInSeconds, 0),
      0,
    ) || 0

  const now = new Date()
  return new Date(now.getTime() + totalDurationInSeconds * 1000)
}

/**
 * Converts a number of seconds into an hh:mm:ss format, omitting leading zeros.
 * @param seconds The total number of seconds.
 * @returns A string in the format hh:mm:ss, mm:ss, or ss depending on the input.
 */
export function formatSecondsToHHMMSS(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: (string | number)[] = []
  if (hrs > 0) parts.push(hrs)
  if (hrs > 0 || mins > 0) parts.push(String(mins).padStart(2, '0'))
  parts.push(String(secs).padStart(2, '0'))

  return parts.join(':')
}
