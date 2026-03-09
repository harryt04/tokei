import {
  cn,
  extractParamFromUrl,
  getDateNMinutesFromNow,
  getDateGivenTimeOfDay,
  calculateSwimLaneRunTimes,
  getRoutineDurationInSeconds,
  getCompletionTime,
  formatSecondsToHHMMSS,
  addUser,
} from '@/lib/utils'
import { Routine, RoutineSwimLane } from '@/models'
import { NextRequest } from 'next/server'

// ─── Shared helpers ──────────────────────────────────────────────────────────

const makeSwimLane = (id: string, durations: number[]): RoutineSwimLane => ({
  id,
  name: `Lane ${id}`,
  steps: durations.map((d, i) => ({
    id: `step-${id}-${i}`,
    swimLaneId: id,
    name: `Step ${i}`,
    sequence: i,
    durationInSeconds: d,
    startType: 'automatic' as const,
  })),
})

const makeRoutine = (swimLanes?: RoutineSwimLane[]): Routine => ({
  _id: 'r1',
  userId: 'u1',
  name: 'Test Routine',
  swimLanes,
})

// ═════════════════════════════════════════════════════════════════════════════
// cn (Tailwind class merging)
// ═════════════════════════════════════════════════════════════════════════════

describe('cn', () => {
  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('passes through a single class string', () => {
    expect(cn('px-4')).toBe('px-4')
  })

  it('merges multiple class strings', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
  })

  it('handles conditional classes (falsy values)', () => {
    expect(cn('px-4', false && 'hidden', null, undefined, '')).toBe('px-4')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    // tailwind-merge should keep only the last conflicting utility
    const result = cn('px-4', 'px-8')
    expect(result).toBe('px-8')
  })

  it('handles object syntax from clsx', () => {
    const result = cn({ 'bg-red-500': true, 'bg-blue-500': false })
    expect(result).toBe('bg-red-500')
    expect(result).not.toContain('bg-blue-500')
  })

  it('handles array syntax from clsx', () => {
    const result = cn(['px-4', 'py-2'])
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
  })

  it('merges conflicting Tailwind utilities across multiple args', () => {
    const result = cn('text-sm', 'text-lg')
    expect(result).toBe('text-lg')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// extractParamFromUrl
// ═════════════════════════════════════════════════════════════════════════════

describe('extractParamFromUrl', () => {
  function makeRequest(url: string): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'))
  }

  it('extracts an existing query parameter', () => {
    const req = makeRequest('/api/routine?id=abc123')
    expect(extractParamFromUrl(req, 'id')).toBe('abc123')
  })

  it('returns null when the parameter is missing', () => {
    const req = makeRequest('/api/routine')
    expect(extractParamFromUrl(req, 'id')).toBeNull()
  })

  it('returns empty string when the parameter has no value', () => {
    const req = makeRequest('/api/routine?id=')
    expect(extractParamFromUrl(req, 'id')).toBe('')
  })

  it('extracts the correct parameter when multiple exist', () => {
    const req = makeRequest('/api/routine?id=abc&name=test')
    expect(extractParamFromUrl(req, 'id')).toBe('abc')
    expect(extractParamFromUrl(req, 'name')).toBe('test')
  })

  it('handles URL-encoded parameter values', () => {
    const req = makeRequest('/api/routine?name=hello%20world')
    expect(extractParamFromUrl(req, 'name')).toBe('hello world')
  })

  it('handles special characters in parameter values', () => {
    const req = makeRequest('/api/routine?q=a%26b%3Dc')
    expect(extractParamFromUrl(req, 'q')).toBe('a&b=c')
  })

  it('returns the first value when a parameter appears multiple times', () => {
    const req = makeRequest('/api/routine?id=first&id=second')
    expect(extractParamFromUrl(req, 'id')).toBe('first')
  })

  it('is case-sensitive for parameter names', () => {
    const req = makeRequest('/api/routine?Id=abc')
    expect(extractParamFromUrl(req, 'id')).toBeNull()
    expect(extractParamFromUrl(req, 'Id')).toBe('abc')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// getDateNMinutesFromNow
// ═════════════════════════════════════════════════════════════════════════════

describe('getDateNMinutesFromNow', () => {
  it('returns a date N minutes in the future', () => {
    const before = Date.now()
    const result = getDateNMinutesFromNow(10)
    const after = Date.now()

    const tenMinutesMs = 10 * 60 * 1000
    expect(result.getTime()).toBeGreaterThanOrEqual(before + tenMinutesMs)
    expect(result.getTime()).toBeLessThanOrEqual(after + tenMinutesMs)
  })

  it('returns current time when 0 minutes', () => {
    const before = Date.now()
    const result = getDateNMinutesFromNow(0)
    const after = Date.now()

    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })

  it('handles negative minutes (past date)', () => {
    const before = Date.now()
    const result = getDateNMinutesFromNow(-5)
    const fiveMinutesMs = 5 * 60 * 1000

    expect(result.getTime()).toBeLessThan(before)
    expect(result.getTime()).toBeGreaterThanOrEqual(before - fiveMinutesMs - 50)
  })

  it('handles fractional minutes', () => {
    const before = Date.now()
    const result = getDateNMinutesFromNow(0.5)
    const after = Date.now()

    const halfMinuteMs = 30 * 1000
    expect(result.getTime()).toBeGreaterThanOrEqual(before + halfMinuteMs)
    expect(result.getTime()).toBeLessThanOrEqual(after + halfMinuteMs)
  })

  it('handles very large values', () => {
    const result = getDateNMinutesFromNow(525600) // one year in minutes
    const now = new Date()
    // Should be roughly one year from now
    const diffMs = result.getTime() - now.getTime()
    const oneYearMs = 525600 * 60 * 1000
    expect(Math.abs(diffMs - oneYearMs)).toBeLessThan(1000)
  })

  it('returns Invalid Date for NaN input', () => {
    const result = getDateNMinutesFromNow(NaN)
    expect(isNaN(result.getTime())).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// getDateGivenTimeOfDay
// ═════════════════════════════════════════════════════════════════════════════

describe('getDateGivenTimeOfDay', () => {
  it('parses "14:30" to 2:30 PM today', () => {
    const result = getDateGivenTimeOfDay('14:30')
    const now = new Date()

    expect(result.getFullYear()).toBe(now.getFullYear())
    expect(result.getMonth()).toBe(now.getMonth())
    expect(result.getDate()).toBe(now.getDate())
    expect(result.getHours()).toBe(14)
    expect(result.getMinutes()).toBe(30)
  })

  it('parses "00:00" to midnight today', () => {
    const result = getDateGivenTimeOfDay('00:00')
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
  })

  it('parses "23:59" to 11:59 PM today', () => {
    const result = getDateGivenTimeOfDay('23:59')
    expect(result.getHours()).toBe(23)
    expect(result.getMinutes()).toBe(59)
  })

  it('always sets seconds and milliseconds to 0', () => {
    const result = getDateGivenTimeOfDay('12:30')
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })

  it('ignores extra parts in the time string (e.g. seconds)', () => {
    // "12:30:45" splits to ["12", "30", "45"], only first two are used
    const result = getDateGivenTimeOfDay('12:30:45')
    expect(result.getHours()).toBe(12)
    expect(result.getMinutes()).toBe(30)
    expect(result.getSeconds()).toBe(0) // seconds not applied
  })

  it('returns Invalid Date for non-numeric input', () => {
    const result = getDateGivenTimeOfDay('abc')
    // "abc".split(':') => ["abc"], .map(Number) => [NaN]
    // hours = NaN, minutes = undefined
    expect(isNaN(result.getTime())).toBe(true)
  })

  it('returns Invalid Date for empty string', () => {
    const result = getDateGivenTimeOfDay('')
    expect(isNaN(result.getTime())).toBe(true)
  })

  it('handles single-digit hours and minutes', () => {
    const result = getDateGivenTimeOfDay('9:5')
    expect(result.getHours()).toBe(9)
    expect(result.getMinutes()).toBe(5)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// calculateSwimLaneRunTimes
// ═════════════════════════════════════════════════════════════════════════════

describe('calculateSwimLaneRunTimes', () => {
  it('sums step durations for each swim lane', () => {
    const lanes = [
      makeSwimLane('a', [60, 120, 30]),
      makeSwimLane('b', [90, 45]),
    ]
    const result = calculateSwimLaneRunTimes(lanes)

    expect(result).toEqual({
      a: 210,
      b: 135,
    })
  })

  it('returns an empty object for an empty array', () => {
    expect(calculateSwimLaneRunTimes([])).toEqual({})
  })

  it('handles a swim lane with no steps', () => {
    const lanes: RoutineSwimLane[] = [{ id: 'empty', name: 'Empty', steps: [] }]
    expect(calculateSwimLaneRunTimes(lanes)).toEqual({ empty: 0 })
  })

  it('handles a single step', () => {
    const lanes = [makeSwimLane('x', [300])]
    expect(calculateSwimLaneRunTimes(lanes)).toEqual({ x: 300 })
  })

  it('handles many swim lanes', () => {
    const lanes = Array.from({ length: 20 }, (_, i) =>
      makeSwimLane(`lane-${i}`, [60]),
    )
    const result = calculateSwimLaneRunTimes(lanes)
    expect(Object.keys(result)).toHaveLength(20)
    Object.values(result).forEach((v) => expect(v).toBe(60))
  })

  it('handles step durations of 0', () => {
    const lanes = [makeSwimLane('a', [0, 0, 0])]
    expect(calculateSwimLaneRunTimes(lanes)).toEqual({ a: 0 })
  })

  it('handles very large step durations', () => {
    const lanes = [makeSwimLane('a', [86400, 86400])] // two full days in seconds
    expect(calculateSwimLaneRunTimes(lanes)).toEqual({ a: 172800 })
  })

  it('handles null/undefined swimLanes gracefully via optional chaining', () => {
    // The source uses swimLanes?.forEach, so null should not crash
    expect(calculateSwimLaneRunTimes(null as any)).toEqual({})
    expect(calculateSwimLaneRunTimes(undefined as any)).toEqual({})
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// getRoutineDurationInSeconds
// ═════════════════════════════════════════════════════════════════════════════

describe('getRoutineDurationInSeconds', () => {
  it('returns 0 for a routine with undefined swim lanes', () => {
    expect(getRoutineDurationInSeconds(makeRoutine(undefined))).toBe(0)
  })

  it('returns 0 for a routine with empty swim lanes', () => {
    expect(getRoutineDurationInSeconds(makeRoutine([]))).toBe(0)
  })

  it('returns the max swim lane duration (parallel execution)', () => {
    const routine = makeRoutine([
      makeSwimLane('a', [60, 120]), // 180s
      makeSwimLane('b', [300]), // 300s
      makeSwimLane('c', [50, 50]), // 100s
    ])
    expect(getRoutineDurationInSeconds(routine)).toBe(300)
  })

  it('returns single swim lane duration', () => {
    const routine = makeRoutine([makeSwimLane('a', [60, 120, 30])])
    expect(getRoutineDurationInSeconds(routine)).toBe(210)
  })

  it('returns 0 when all swim lanes have zero-duration steps', () => {
    const routine = makeRoutine([
      makeSwimLane('a', [0, 0]),
      makeSwimLane('b', [0]),
    ])
    expect(getRoutineDurationInSeconds(routine)).toBe(0)
  })

  it('returns 0 when swim lanes exist but all have empty steps', () => {
    const routine = makeRoutine([
      { id: 'a', name: 'A', steps: [] },
      { id: 'b', name: 'B', steps: [] },
    ])
    expect(getRoutineDurationInSeconds(routine)).toBe(0)
  })

  it('correctly identifies max across many swim lanes', () => {
    const lanes = Array.from({ length: 10 }, (_, i) =>
      makeSwimLane(`lane-${i}`, [i * 10]),
    )
    const routine = makeRoutine(lanes)
    expect(getRoutineDurationInSeconds(routine)).toBe(90) // lane-9 has 90s
  })

  it('handles single step with 1 second', () => {
    const routine = makeRoutine([makeSwimLane('a', [1])])
    expect(getRoutineDurationInSeconds(routine)).toBe(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// getCompletionTime
// ═════════════════════════════════════════════════════════════════════════════

describe('getCompletionTime', () => {
  it('returns a date offset by the routine duration', () => {
    const routine = makeRoutine([
      makeSwimLane('lane1', [120]), // 2 minutes
    ])

    const before = Date.now()
    const result = getCompletionTime(routine)
    const after = Date.now()

    const expectedOffset = 120 * 1000
    expect(result.getTime()).toBeGreaterThanOrEqual(before + expectedOffset)
    expect(result.getTime()).toBeLessThanOrEqual(after + expectedOffset)
  })

  it('returns approximately now for a routine with no steps', () => {
    const routine = makeRoutine()

    const before = Date.now()
    const result = getCompletionTime(routine)
    const after = Date.now()

    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })

  it('returns a Date object (not a number or string)', () => {
    const result = getCompletionTime(makeRoutine())
    expect(result).toBeInstanceOf(Date)
  })

  it('uses the longest swim lane for completion calculation', () => {
    const routine = makeRoutine([
      makeSwimLane('short', [30]),
      makeSwimLane('long', [300]),
    ])

    const before = Date.now()
    const result = getCompletionTime(routine)
    const after = Date.now()

    // Should be 300 seconds from now, not 30
    const expectedOffset = 300 * 1000
    expect(result.getTime()).toBeGreaterThanOrEqual(before + expectedOffset)
    expect(result.getTime()).toBeLessThanOrEqual(after + expectedOffset)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// formatSecondsToHHMMSS
// ═════════════════════════════════════════════════════════════════════════════

describe('formatSecondsToHHMMSS', () => {
  it('formats 0 seconds', () => {
    expect(formatSecondsToHHMMSS(0)).toBe('00')
  })

  it('formats seconds only (< 60)', () => {
    expect(formatSecondsToHHMMSS(1)).toBe('01')
    expect(formatSecondsToHHMMSS(5)).toBe('05')
    expect(formatSecondsToHHMMSS(9)).toBe('09')
    expect(formatSecondsToHHMMSS(10)).toBe('10')
    expect(formatSecondsToHHMMSS(45)).toBe('45')
    expect(formatSecondsToHHMMSS(59)).toBe('59')
  })

  it('formats exact minute boundaries', () => {
    expect(formatSecondsToHHMMSS(60)).toBe('01:00')
    expect(formatSecondsToHHMMSS(120)).toBe('02:00')
    expect(formatSecondsToHHMMSS(600)).toBe('10:00')
    expect(formatSecondsToHHMMSS(3540)).toBe('59:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatSecondsToHHMMSS(61)).toBe('01:01')
    expect(formatSecondsToHHMMSS(90)).toBe('01:30')
    expect(formatSecondsToHHMMSS(605)).toBe('10:05')
    expect(formatSecondsToHHMMSS(3599)).toBe('59:59')
  })

  it('formats exact hour boundaries', () => {
    expect(formatSecondsToHHMMSS(3600)).toBe('1:00:00')
    expect(formatSecondsToHHMMSS(7200)).toBe('2:00:00')
    expect(formatSecondsToHHMMSS(36000)).toBe('10:00:00')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatSecondsToHHMMSS(3661)).toBe('1:01:01')
    expect(formatSecondsToHHMMSS(7384)).toBe('2:03:04')
  })

  it('pads minutes and seconds with leading zeros', () => {
    expect(formatSecondsToHHMMSS(3601)).toBe('1:00:01')
    expect(formatSecondsToHHMMSS(3660)).toBe('1:01:00')
  })

  it('does not pad hours with leading zeros', () => {
    expect(formatSecondsToHHMMSS(3600)).toBe('1:00:00')
    expect(formatSecondsToHHMMSS(36000)).toBe('10:00:00')
    // Hours are pushed as a raw number, not padded
  })

  it('handles very large values (24+ hours)', () => {
    expect(formatSecondsToHHMMSS(86400)).toBe('24:00:00')
    expect(formatSecondsToHHMMSS(90061)).toBe('25:01:01')
  })

  it('handles negative seconds (edge case behavior)', () => {
    // Math.floor(-1/3600) = -1, (-1 % 3600) = -1, Math.floor(-1/60) = -1, (-1 % 60) = -1
    // hrs=-1 (not > 0), mins=-1 (hrs>0 is false, mins>0 is false), secs=-1
    // Only secs pushed: padStart(2,'0') on "-1" -> "-1" (length 2, no pad)
    const result = formatSecondsToHHMMSS(-1)
    expect(result).toBe('-1')
  })

  it('handles fractional seconds', () => {
    // 90.5: hrs=0, mins=1, secs=90.5 % 60 = 30.5
    // parts = ["01", "30.5"] -> "01:30.5"
    const result = formatSecondsToHHMMSS(90.5)
    expect(result).toBe('01:30.5')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// addUser (fire-and-forget analytics)
// ═════════════════════════════════════════════════════════════════════════════

describe('addUser', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(new Response('ok'))
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('sends POST to harryt.dev with email when user has email', () => {
    addUser({ email: 'test@example.com' })

    expect(global.fetch).toHaveBeenCalledWith('https://harryt.dev/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', usesApps: ['tokei'] }),
    })
  })

  it('does not call fetch when user is null', () => {
    addUser(null)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not call fetch when user.email is null', () => {
    addUser({ email: null })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not call fetch when user.email is undefined', () => {
    addUser({ email: undefined })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not call fetch when user.email is empty string', () => {
    addUser({ email: '' })
    // Empty string is falsy, so no fetch
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('silently swallows fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    // Should not throw
    expect(() => addUser({ email: 'test@example.com' })).not.toThrow()

    // Wait for the promise chain to settle
    await new Promise((resolve) => setTimeout(resolve, 10))
  })

  it('silently swallows non-ok responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new Response('error', { status: 500 }),
    )

    // addUser doesn't check response.ok, so this should not throw
    expect(() => addUser({ email: 'test@example.com' })).not.toThrow()
  })

  it('does not call fetch when user object has no email key', () => {
    addUser({} as any)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
