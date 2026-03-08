import {
  extractParamFromUrl,
  getDateNMinutesFromNow,
  getDateGivenTimeOfDay,
  calculateSwimLaneRunTimes,
  getRoutineDurationInSeconds,
  getCompletionTime,
  formatSecondsToHHMMSS,
} from '@/lib/utils'
import { Routine, RoutineSwimLane } from '@/models'
import { NextRequest } from 'next/server'

// ─── extractParamFromUrl ─────────────────────────────────────────────────────

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
})

// ─── getDateNMinutesFromNow ──────────────────────────────────────────────────

describe('getDateNMinutesFromNow', () => {
  it('returns a date N minutes in the future', () => {
    const before = Date.now()
    const result = getDateNMinutesFromNow(10)
    const after = Date.now()

    // The result should be roughly 10 minutes from now
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
})

// ─── getDateGivenTimeOfDay ───────────────────────────────────────────────────

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
})

// ─── calculateSwimLaneRunTimes ───────────────────────────────────────────────

describe('calculateSwimLaneRunTimes', () => {
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
})

// ─── getRoutineDurationInSeconds ─────────────────────────────────────────────

describe('getRoutineDurationInSeconds', () => {
  const makeRoutine = (swimLanes?: RoutineSwimLane[]): Routine => ({
    _id: 'r1',
    userId: 'u1',
    name: 'Test Routine',
    swimLanes,
  })

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

  it('returns 0 for a routine with no swim lanes', () => {
    expect(getRoutineDurationInSeconds(makeRoutine(undefined))).toBe(0)
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
})

// ─── getCompletionTime ───────────────────────────────────────────────────────

describe('getCompletionTime', () => {
  it('returns a date offset by the routine duration', () => {
    const routine: Routine = {
      _id: 'r1',
      userId: 'u1',
      name: 'Test',
      swimLanes: [
        {
          id: 'lane1',
          name: 'Lane 1',
          steps: [
            {
              id: 's1',
              swimLaneId: 'lane1',
              name: 'Step 1',
              sequence: 0,
              durationInSeconds: 120,
              startType: 'automatic',
            },
          ],
        },
      ],
    }

    const before = Date.now()
    const result = getCompletionTime(routine)
    const after = Date.now()

    const expectedOffset = 120 * 1000
    expect(result.getTime()).toBeGreaterThanOrEqual(before + expectedOffset)
    expect(result.getTime()).toBeLessThanOrEqual(after + expectedOffset)
  })

  it('returns approximately now for a routine with no steps', () => {
    const routine: Routine = {
      _id: 'r1',
      userId: 'u1',
      name: 'Empty',
    }

    const before = Date.now()
    const result = getCompletionTime(routine)
    const after = Date.now()

    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })
})

// ─── formatSecondsToHHMMSS ──────────────────────────────────────────────────

describe('formatSecondsToHHMMSS', () => {
  it('formats 0 seconds', () => {
    expect(formatSecondsToHHMMSS(0)).toBe('00')
  })

  it('formats seconds only (< 60)', () => {
    expect(formatSecondsToHHMMSS(5)).toBe('05')
    expect(formatSecondsToHHMMSS(45)).toBe('45')
  })

  it('formats minutes and seconds', () => {
    expect(formatSecondsToHHMMSS(60)).toBe('01:00')
    expect(formatSecondsToHHMMSS(90)).toBe('01:30')
    expect(formatSecondsToHHMMSS(605)).toBe('10:05')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatSecondsToHHMMSS(3600)).toBe('1:00:00')
    expect(formatSecondsToHHMMSS(3661)).toBe('1:01:01')
    expect(formatSecondsToHHMMSS(7200)).toBe('2:00:00')
    expect(formatSecondsToHHMMSS(7384)).toBe('2:03:04')
  })

  it('pads minutes and seconds with leading zeros', () => {
    expect(formatSecondsToHHMMSS(3601)).toBe('1:00:01')
    expect(formatSecondsToHHMMSS(61)).toBe('01:01')
  })
})
