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

export const speakText = (text: string): void => {
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  speechSynthesis.speak(utterance)
}

export const playAlarm = (durationInSeconds: number = 2): Promise<void> => {
  return new Promise((resolve) => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + durationInSeconds,
    ) // Fade out over the specified duration
    oscillator.stop(audioContext.currentTime + durationInSeconds)

    oscillator.onended = () => resolve() // Resolve the promise when the sound stops
  })
}

export const speakTextWithAlarm = async (text: string): Promise<void> => {
  const numDings = 5
  const alarmDuration = 0.5 // seconds per ding

  for (let i = 0; i < numDings; i++) {
    await playAlarm(alarmDuration) // Wait for each alarm to finish
  }

  speakText(text) // Speak the text after all alarms have finished
}
