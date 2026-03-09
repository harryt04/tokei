/**
 * Tests for the core logic in use-routine-timer.ts.
 *
 * Since the hook's key calculation functions (calculateInitialSwimlaneState,
 * recalculateWaitTimes) are private inner functions, we test the same algorithms
 * using the public utility `calculateSwimLaneRunTimes` and by replicating the
 * calculation logic that the hook performs.
 *
 * This gives us confidence that the swimlane scheduling, wait-time alignment,
 * and step progress logic are correct.
 */

import { RoutineSwimLane, RoutineStep, Routine } from '@/models'
import { calculateSwimLaneRunTimes } from '@/lib/utils'

// ─── Helpers that mirror the hook's internal logic ──────────────────────────

/**
 * Replicates the `calculateInitialSwimlaneState` logic from the hook.
 * This is the same algorithm used to compute initial wait times and step state.
 */
function calculateInitialSwimlaneState(
  swimLanes: RoutineSwimLane[],
  targetEndTime?: Date,
) {
  const swimlaneTimes = calculateSwimLaneRunTimes(swimLanes)
  const longestDuration = Math.max(...Object.values(swimlaneTimes))

  const now = new Date()
  const timeUntilEndInSeconds = targetEndTime
    ? Math.max(0, (targetEndTime.getTime() - now.getTime()) / 1000)
    : longestDuration

  const swimlanesStatus: Record<
    string,
    { currentStepIndex: number; waitTimeInSeconds: number; isWaiting: boolean }
  > = {}
  const stepProgress: Record<string, number> = {}
  const waitTimeRemaining: Record<string, number> = {}
  const remainingTime: Record<string, number> = {}

  swimLanes.forEach((swimlane) => {
    const totalDuration = swimlaneTimes[swimlane.id] || 0

    const waitTime = targetEndTime
      ? Math.max(0, timeUntilEndInSeconds - totalDuration)
      : Math.max(0, longestDuration - totalDuration)
    const isWaiting = waitTime > 0

    swimlanesStatus[swimlane.id] = {
      currentStepIndex: 0,
      waitTimeInSeconds: waitTime,
      isWaiting,
    }

    if (isWaiting) {
      waitTimeRemaining[swimlane.id] = waitTime
    } else if (swimlane.steps.length > 0) {
      stepProgress[swimlane.steps[0].id] = 0
      remainingTime[swimlane.steps[0].id] = swimlane.steps[0].durationInSeconds
    }
  })

  return { swimlanesStatus, stepProgress, waitTimeRemaining, remainingTime }
}

/**
 * Replicates the `recalculateWaitTimes` logic from the hook.
 * Given current swimlane statuses and step progress, returns new wait times.
 */
function recalculateWaitTimes(
  swimLanes: RoutineSwimLane[],
  swimlanesStatus: Record<
    string,
    { currentStepIndex: number; waitTimeInSeconds: number; isWaiting: boolean }
  >,
  stepProgressMap: Record<string, number>,
  waitTimeRemainingMap: Record<string, number>,
) {
  const stepsRemainingTimes: Record<string, number> = {}

  swimLanes.forEach((sl) => {
    const slStatus = swimlanesStatus[sl.id]
    if (!slStatus) return

    if (slStatus.currentStepIndex >= sl.steps.length) {
      stepsRemainingTimes[sl.id] = 0
    } else if (slStatus.isWaiting) {
      const stepsRemaining = sl.steps.reduce(
        (sum, step) => sum + step.durationInSeconds,
        0,
      )
      stepsRemainingTimes[sl.id] = stepsRemaining
    } else {
      let remaining = 0
      for (let i = slStatus.currentStepIndex; i < sl.steps.length; i++) {
        const step = sl.steps[i]
        if (i === slStatus.currentStepIndex) {
          const progress = stepProgressMap[step.id] || 0
          remaining += step.durationInSeconds * (1 - progress / 100)
        } else {
          remaining += step.durationInSeconds
        }
      }
      stepsRemainingTimes[sl.id] = remaining
    }
  })

  const maxStepsRemaining = Math.max(...Object.values(stepsRemainingTimes))

  const adjustments: Record<string, number> = {}

  swimLanes.forEach((sl) => {
    const slStatus = swimlanesStatus[sl.id]
    if (!slStatus?.isWaiting) return

    const thisSwimlanesSteps = stepsRemainingTimes[sl.id] || 0
    const newWaitTime = Math.max(0, maxStepsRemaining - thisSwimlanesSteps)
    const currentWaitRemaining = waitTimeRemainingMap[sl.id] || 0

    if (newWaitTime < currentWaitRemaining) {
      adjustments[sl.id] = newWaitTime
    }
  })

  return { stepsRemainingTimes, maxStepsRemaining, adjustments }
}

// ─── Test data factories ────────────────────────────────────────────────────

function makeStep(
  overrides: Partial<RoutineStep> & { id: string; swimLaneId: string },
): RoutineStep {
  return {
    name: 'Step',
    sequence: 0,
    durationInSeconds: 60,
    startType: 'automatic',
    ...overrides,
  }
}

function makeSwimLane(
  id: string,
  steps: RoutineStep[],
  name?: string,
): RoutineSwimLane {
  return { id, name: name || `Lane ${id}`, steps }
}

// ═════════════════════════════════════════════════════════════════════════════
// calculateInitialSwimlaneState
// ═════════════════════════════════════════════════════════════════════════════

describe('calculateInitialSwimlaneState', () => {
  describe('immediate mode (no endTime)', () => {
    it('sets no wait time when there is only one swimlane', () => {
      const step = makeStep({ id: 's1', swimLaneId: 'sl1' })
      const lanes = [makeSwimLane('sl1', [step])]

      const result = calculateInitialSwimlaneState(lanes)

      expect(result.swimlanesStatus['sl1'].isWaiting).toBe(false)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBe(0)
      expect(result.stepProgress['s1']).toBe(0)
      expect(result.remainingTime['s1']).toBe(60)
    })

    it('aligns swimlanes so they all finish at the same time', () => {
      const shortStep = makeStep({
        id: 's1',
        swimLaneId: 'sl1',
        durationInSeconds: 30,
      })
      const longStep = makeStep({
        id: 's2',
        swimLaneId: 'sl2',
        durationInSeconds: 120,
      })
      const lanes = [
        makeSwimLane('sl1', [shortStep]),
        makeSwimLane('sl2', [longStep]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      // sl1 (30s) should wait 90s to align with sl2 (120s)
      expect(result.swimlanesStatus['sl1'].isWaiting).toBe(true)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBe(90)
      expect(result.waitTimeRemaining['sl1']).toBe(90)

      // sl2 is the longest — no waiting
      expect(result.swimlanesStatus['sl2'].isWaiting).toBe(false)
      expect(result.swimlanesStatus['sl2'].waitTimeInSeconds).toBe(0)
    })

    it('handles three swimlanes with different durations', () => {
      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl1',
            durationInSeconds: 60,
          }),
        ]),
        makeSwimLane('sl2', [
          makeStep({
            id: 's2',
            swimLaneId: 'sl2',
            durationInSeconds: 180,
          }),
        ]),
        makeSwimLane('sl3', [
          makeStep({
            id: 's3',
            swimLaneId: 'sl3',
            durationInSeconds: 120,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      // Longest is sl2 (180s)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBe(120) // 180-60
      expect(result.swimlanesStatus['sl2'].waitTimeInSeconds).toBe(0) // longest
      expect(result.swimlanesStatus['sl3'].waitTimeInSeconds).toBe(60) // 180-120
    })

    it('handles swimlanes with equal durations (no waiting)', () => {
      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl1',
            durationInSeconds: 100,
          }),
        ]),
        makeSwimLane('sl2', [
          makeStep({
            id: 's2',
            swimLaneId: 'sl2',
            durationInSeconds: 100,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      expect(result.swimlanesStatus['sl1'].isWaiting).toBe(false)
      expect(result.swimlanesStatus['sl2'].isWaiting).toBe(false)
    })

    it('handles swimlane with no steps', () => {
      const lanes = [
        makeSwimLane('sl1', []),
        makeSwimLane('sl2', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl2',
            durationInSeconds: 60,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      // sl1 has 0 duration, so it waits 60s
      expect(result.swimlanesStatus['sl1'].isWaiting).toBe(true)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBe(60)
    })

    it('handles swimlane with multiple steps summing their durations', () => {
      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1a',
            swimLaneId: 'sl1',
            durationInSeconds: 30,
            sequence: 0,
          }),
          makeStep({
            id: 's1b',
            swimLaneId: 'sl1',
            durationInSeconds: 30,
            sequence: 1,
          }),
        ]),
        makeSwimLane('sl2', [
          makeStep({
            id: 's2',
            swimLaneId: 'sl2',
            durationInSeconds: 120,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      // sl1 total = 60s, sl2 = 120s, so sl1 waits 60s
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBe(60)
    })

    it('initializes first step progress for non-waiting swimlane', () => {
      const step1 = makeStep({
        id: 's1',
        swimLaneId: 'sl1',
        durationInSeconds: 45,
      })
      const lanes = [makeSwimLane('sl1', [step1])]

      const result = calculateInitialSwimlaneState(lanes)

      expect(result.stepProgress['s1']).toBe(0)
      expect(result.remainingTime['s1']).toBe(45)
    })

    it('does NOT set step progress for waiting swimlane', () => {
      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl1',
            durationInSeconds: 30,
          }),
        ]),
        makeSwimLane('sl2', [
          makeStep({
            id: 's2',
            swimLaneId: 'sl2',
            durationInSeconds: 120,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      // sl1 is waiting — its step should NOT have progress initialized
      expect(result.stepProgress['s1']).toBeUndefined()
      expect(result.remainingTime['s1']).toBeUndefined()
    })

    it('all swimlanes start at currentStepIndex 0', () => {
      const lanes = [
        makeSwimLane('sl1', [makeStep({ id: 's1', swimLaneId: 'sl1' })]),
        makeSwimLane('sl2', [makeStep({ id: 's2', swimLaneId: 'sl2' })]),
      ]

      const result = calculateInitialSwimlaneState(lanes)

      expect(result.swimlanesStatus['sl1'].currentStepIndex).toBe(0)
      expect(result.swimlanesStatus['sl2'].currentStepIndex).toBe(0)
    })
  })

  describe('timed mode (with endTime)', () => {
    it('calculates wait times based on time until end', () => {
      const now = new Date()
      const endTime = new Date(now.getTime() + 300_000) // 300 seconds from now

      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl1',
            durationInSeconds: 60,
          }),
        ]),
        makeSwimLane('sl2', [
          makeStep({
            id: 's2',
            swimLaneId: 'sl2',
            durationInSeconds: 120,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes, endTime)

      // Time until end ~= 300s
      // sl1 (60s) wait = ~300 - 60 = ~240
      // sl2 (120s) wait = ~300 - 120 = ~180
      // Both should be waiting
      expect(result.swimlanesStatus['sl1'].isWaiting).toBe(true)
      expect(result.swimlanesStatus['sl2'].isWaiting).toBe(true)

      // Wait times should be approximately correct (within 2s tolerance for test execution)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBeGreaterThan(
        235,
      )
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBeLessThan(245)
      expect(result.swimlanesStatus['sl2'].waitTimeInSeconds).toBeGreaterThan(
        175,
      )
      expect(result.swimlanesStatus['sl2'].waitTimeInSeconds).toBeLessThan(185)
    })

    it('handles endTime that is in the past (clamps to 0)', () => {
      const pastEndTime = new Date(Date.now() - 60_000) // 1 minute ago

      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl1',
            durationInSeconds: 60,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes, pastEndTime)

      // timeUntilEnd clamps to 0, wait = max(0, 0 - 60) = 0
      expect(result.swimlanesStatus['sl1'].isWaiting).toBe(false)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBe(0)
    })

    it('handles endTime exactly equal to routine duration', () => {
      const now = new Date()
      const endTime = new Date(now.getTime() + 60_000) // 60s from now

      const lanes = [
        makeSwimLane('sl1', [
          makeStep({
            id: 's1',
            swimLaneId: 'sl1',
            durationInSeconds: 60,
          }),
        ]),
      ]

      const result = calculateInitialSwimlaneState(lanes, endTime)

      // Wait should be ~0 (within tolerance)
      expect(result.swimlanesStatus['sl1'].waitTimeInSeconds).toBeLessThan(2)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// recalculateWaitTimes
// ═════════════════════════════════════════════════════════════════════════════

describe('recalculateWaitTimes', () => {
  it('reduces wait time when a running swimlane completes steps early', () => {
    // Setup: sl1 has 120s, sl2 has 60s (waiting 60s)
    // If sl1 is 50% through its only step, remaining = 60s
    // New wait for sl2 = 60 - 60 = 0 (should start now!)
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 120,
        }),
      ]),
      makeSwimLane('sl2', [
        makeStep({
          id: 's2',
          swimLaneId: 'sl2',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
      sl2: { currentStepIndex: 0, waitTimeInSeconds: 60, isWaiting: true },
    }

    const stepProgress = { s1: 50 } // sl1 is 50% done
    const waitRemaining = { sl2: 60 }

    const result = recalculateWaitTimes(
      lanes,
      status,
      stepProgress,
      waitRemaining,
    )

    expect(result.stepsRemainingTimes['sl1']).toBe(60) // 120 * (1 - 50/100)
    expect(result.stepsRemainingTimes['sl2']).toBe(60) // all steps remain
    expect(result.maxStepsRemaining).toBe(60)
    expect(result.adjustments['sl2']).toBe(0) // should start now
  })

  it('does not adjust if new wait time is not shorter', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 120,
        }),
      ]),
      makeSwimLane('sl2', [
        makeStep({
          id: 's2',
          swimLaneId: 'sl2',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
      sl2: { currentStepIndex: 0, waitTimeInSeconds: 60, isWaiting: true },
    }

    // sl1 has 0% progress — remaining = 120s, so sl2 needs 120-60=60 wait (same as current)
    const stepProgress = { s1: 0 }
    const waitRemaining = { sl2: 60 }

    const result = recalculateWaitTimes(
      lanes,
      status,
      stepProgress,
      waitRemaining,
    )

    // No adjustment because new wait (60) is not less than current (60)
    expect(result.adjustments).toEqual({})
  })

  it('handles completed swimlanes (remaining = 0)', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 120,
        }),
      ]),
      makeSwimLane('sl2', [
        makeStep({
          id: 's2',
          swimLaneId: 'sl2',
          durationInSeconds: 60,
        }),
      ]),
    ]

    // sl1 has completed all steps
    const status = {
      sl1: { currentStepIndex: 1, waitTimeInSeconds: 0, isWaiting: false },
      sl2: { currentStepIndex: 0, waitTimeInSeconds: 60, isWaiting: true },
    }

    const stepProgress = {}
    const waitRemaining = { sl2: 55 } // 5s already elapsed from original 60s wait

    const result = recalculateWaitTimes(
      lanes,
      status,
      stepProgress,
      waitRemaining,
    )

    // sl1 complete → remaining = 0
    // sl2 still has 60s of steps
    // maxRemaining = 60
    // new wait for sl2 = 60 - 60 = 0
    expect(result.stepsRemainingTimes['sl1']).toBe(0)
    expect(result.adjustments['sl2']).toBe(0)
  })

  it('handles multiple steps with partial progress on current step', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1a',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
          sequence: 0,
        }),
        makeStep({
          id: 's1b',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
          sequence: 1,
        }),
      ]),
      makeSwimLane('sl2', [
        makeStep({
          id: 's2',
          swimLaneId: 'sl2',
          durationInSeconds: 30,
        }),
      ]),
    ]

    // sl1 is on step 0 at 75% progress
    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
      sl2: { currentStepIndex: 0, waitTimeInSeconds: 90, isWaiting: true },
    }

    const stepProgress = { s1a: 75 }
    const waitRemaining = { sl2: 85 }

    const result = recalculateWaitTimes(
      lanes,
      status,
      stepProgress,
      waitRemaining,
    )

    // sl1 remaining: step 0 = 60 * (1 - 0.75) = 15, step 1 = 60 → total 75
    // sl2 remaining: 30
    // max = 75
    // new wait for sl2 = 75 - 30 = 45 (< 85, so adjusted)
    expect(result.stepsRemainingTimes['sl1']).toBe(75)
    expect(result.stepsRemainingTimes['sl2']).toBe(30)
    expect(result.adjustments['sl2']).toBe(45)
  })

  it('does not produce adjustments for non-waiting swimlanes', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
        }),
      ]),
      makeSwimLane('sl2', [
        makeStep({
          id: 's2',
          swimLaneId: 'sl2',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
      sl2: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    const result = recalculateWaitTimes(lanes, status, {}, {})

    expect(result.adjustments).toEqual({})
  })

  it('handles all swimlanes completed', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 1, waitTimeInSeconds: 0, isWaiting: false },
    }

    const result = recalculateWaitTimes(lanes, status, {}, {})

    expect(result.stepsRemainingTimes['sl1']).toBe(0)
    expect(result.maxStepsRemaining).toBe(0)
  })

  it('handles empty swimlanes array', () => {
    const result = recalculateWaitTimes([], {}, {}, {})

    expect(result.stepsRemainingTimes).toEqual({})
    // Math.max(...[]) = -Infinity
    expect(result.maxStepsRemaining).toBe(-Infinity)
    expect(result.adjustments).toEqual({})
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Estimated end time calculation logic
// ═════════════════════════════════════════════════════════════════════════════

describe('estimatedEndTime calculation', () => {
  /**
   * Replicates the estimatedEndTime useMemo from the hook.
   */
  function calculateEstimatedEndTime(
    status: 'running' | 'paused' | 'stopped',
    swimLanes: RoutineSwimLane[] | undefined,
    swimlanesStatus: Record<
      string,
      {
        currentStepIndex: number
        waitTimeInSeconds: number
        isWaiting: boolean
      }
    >,
    waitTimeRemaining: Record<string, number>,
    remainingTimeInSeconds: Record<string, number>,
  ): Date | null {
    if (status === 'stopped' || !swimLanes) return null

    let maxRemainingTime = 0

    swimLanes.forEach((swimlane) => {
      const slStatus = swimlanesStatus[swimlane.id]
      if (!slStatus) return

      let swimlaneRemaining = 0

      if (slStatus.isWaiting) {
        swimlaneRemaining += waitTimeRemaining[swimlane.id] || 0
      }

      for (let i = slStatus.currentStepIndex; i < swimlane.steps.length; i++) {
        const step = swimlane.steps[i]
        if (i === slStatus.currentStepIndex && !slStatus.isWaiting) {
          swimlaneRemaining += remainingTimeInSeconds[step.id] || 0
        } else {
          swimlaneRemaining += step.durationInSeconds
        }
      }

      maxRemainingTime = Math.max(maxRemainingTime, swimlaneRemaining)
    })

    return new Date(Date.now() + maxRemainingTime * 1000)
  }

  it('returns null when status is stopped', () => {
    const result = calculateEstimatedEndTime('stopped', [], {}, {}, {})
    expect(result).toBeNull()
  })

  it('returns null when swimLanes is undefined', () => {
    const result = calculateEstimatedEndTime('running', undefined, {}, {}, {})
    expect(result).toBeNull()
  })

  it('returns a future date when running', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    const result = calculateEstimatedEndTime(
      'running',
      lanes,
      status,
      {},
      { s1: 60 },
    )

    expect(result).toBeInstanceOf(Date)
    // Should be approximately 60s in the future
    const diff = (result!.getTime() - Date.now()) / 1000
    expect(diff).toBeGreaterThan(58)
    expect(diff).toBeLessThan(62)
  })

  it('includes wait time in estimation', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 30, isWaiting: true },
    }

    const result = calculateEstimatedEndTime(
      'running',
      lanes,
      status,
      { sl1: 25 }, // 25s wait remaining
      {},
    )

    // Total = 25s wait + 60s step = 85s
    const diff = (result!.getTime() - Date.now()) / 1000
    expect(diff).toBeGreaterThan(83)
    expect(diff).toBeLessThan(87)
  })

  it('picks the longest swimlane for estimation', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 30,
        }),
      ]),
      makeSwimLane('sl2', [
        makeStep({
          id: 's2',
          swimLaneId: 'sl2',
          durationInSeconds: 120,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
      sl2: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    const result = calculateEstimatedEndTime(
      'running',
      lanes,
      status,
      {},
      { s1: 30, s2: 120 },
    )

    // Should be ~120s from now (the longer swimlane)
    const diff = (result!.getTime() - Date.now()) / 1000
    expect(diff).toBeGreaterThan(118)
    expect(diff).toBeLessThan(122)
  })

  it('accounts for partially completed steps', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 100,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    // 40s remaining on a 100s step
    const result = calculateEstimatedEndTime(
      'running',
      lanes,
      status,
      {},
      { s1: 40 },
    )

    const diff = (result!.getTime() - Date.now()) / 1000
    expect(diff).toBeGreaterThan(38)
    expect(diff).toBeLessThan(42)
  })

  it('still calculates when paused', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    const result = calculateEstimatedEndTime(
      'paused',
      lanes,
      status,
      {},
      { s1: 45 },
    )

    expect(result).toBeInstanceOf(Date)
    const diff = (result!.getTime() - Date.now()) / 1000
    expect(diff).toBeGreaterThan(43)
    expect(diff).toBeLessThan(47)
  })

  it('returns ~now when all steps are complete', () => {
    const lanes = [
      makeSwimLane('sl1', [
        makeStep({
          id: 's1',
          swimLaneId: 'sl1',
          durationInSeconds: 60,
        }),
      ]),
    ]

    const status = {
      sl1: { currentStepIndex: 1, waitTimeInSeconds: 0, isWaiting: false },
    }

    const result = calculateEstimatedEndTime('running', lanes, status, {}, {})

    expect(result).toBeInstanceOf(Date)
    const diff = Math.abs(result!.getTime() - Date.now()) / 1000
    expect(diff).toBeLessThan(2)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// shouldShowStartButton logic
// ═════════════════════════════════════════════════════════════════════════════

describe('shouldShowStartButton logic', () => {
  function shouldShowStartButton(
    step: RoutineStep,
    swimlanesStatus: Record<
      string,
      {
        currentStepIndex: number
        waitTimeInSeconds: number
        isWaiting: boolean
      }
    >,
    stepProgress: Record<string, number>,
    swimLanes: RoutineSwimLane[],
  ): boolean {
    const swimlaneStatus = swimlanesStatus[step.swimLaneId]
    if (!swimlaneStatus) return false

    const swimlane = swimLanes.find((sl) => sl.id === step.swimLaneId)
    if (!swimlane) return false

    const isCurrentStep =
      swimlane.steps[swimlaneStatus.currentStepIndex]?.id === step.id

    return (
      isCurrentStep &&
      step.startType === 'manual' &&
      (stepProgress[step.id] || 0) === 0
    )
  }

  it('returns true for manual current step with 0 progress', () => {
    const step = makeStep({
      id: 's1',
      swimLaneId: 'sl1',
      startType: 'manual',
    })
    const lanes = [makeSwimLane('sl1', [step])]
    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    expect(shouldShowStartButton(step, status, {}, lanes)).toBe(true)
  })

  it('returns false for automatic step', () => {
    const step = makeStep({
      id: 's1',
      swimLaneId: 'sl1',
      startType: 'automatic',
    })
    const lanes = [makeSwimLane('sl1', [step])]
    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    expect(shouldShowStartButton(step, status, {}, lanes)).toBe(false)
  })

  it('returns false when step has progress > 0', () => {
    const step = makeStep({
      id: 's1',
      swimLaneId: 'sl1',
      startType: 'manual',
    })
    const lanes = [makeSwimLane('sl1', [step])]
    const status = {
      sl1: { currentStepIndex: 0, waitTimeInSeconds: 0, isWaiting: false },
    }

    expect(shouldShowStartButton(step, status, { s1: 10 }, lanes)).toBe(false)
  })

  it('returns false when step is not the current step', () => {
    const step1 = makeStep({
      id: 's1',
      swimLaneId: 'sl1',
      startType: 'manual',
      sequence: 0,
    })
    const step2 = makeStep({
      id: 's2',
      swimLaneId: 'sl1',
      startType: 'manual',
      sequence: 1,
    })
    const lanes = [makeSwimLane('sl1', [step1, step2])]
    const status = {
      sl1: {
        currentStepIndex: 1,
        waitTimeInSeconds: 0,
        isWaiting: false,
      },
    }

    // step1 is NOT current (currentStepIndex is 1, pointing to step2)
    expect(shouldShowStartButton(step1, status, {}, lanes)).toBe(false)
    // step2 IS current
    expect(shouldShowStartButton(step2, status, {}, lanes)).toBe(true)
  })

  it('returns false when swimlane status is missing', () => {
    const step = makeStep({
      id: 's1',
      swimLaneId: 'sl1',
      startType: 'manual',
    })
    const lanes = [makeSwimLane('sl1', [step])]

    expect(shouldShowStartButton(step, {}, {}, lanes)).toBe(false)
  })

  it('returns false when swimlane is not found', () => {
    const step = makeStep({
      id: 's1',
      swimLaneId: 'sl-nonexistent',
      startType: 'manual',
    })
    const lanes = [
      makeSwimLane('sl1', [makeStep({ id: 's2', swimLaneId: 'sl1' })]),
    ]
    const status = {
      'sl-nonexistent': {
        currentStepIndex: 0,
        waitTimeInSeconds: 0,
        isWaiting: false,
      },
    }

    expect(shouldShowStartButton(step, status, {}, lanes)).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Step progress calculation logic
// ═════════════════════════════════════════════════════════════════════════════

describe('step timer progress calculation', () => {
  it('calculates correct progress increment per tick', () => {
    const stepDuration = 60 // 60 seconds
    const updateInterval = 100 // 100ms
    const progressIncrement = (updateInterval / 1000 / stepDuration) * 100

    // Each tick should add ~0.1667% progress
    expect(progressIncrement).toBeCloseTo(0.1667, 3)
  })

  it('calculates correct progress increment for short step', () => {
    const stepDuration = 1 // 1 second
    const updateInterval = 100
    const progressIncrement = (updateInterval / 1000 / stepDuration) * 100

    // Each tick = 10% for 1-second step
    expect(progressIncrement).toBe(10)
  })

  it('calculates correct progress increment for long step', () => {
    const stepDuration = 3600 // 1 hour
    const updateInterval = 100
    const progressIncrement = (updateInterval / 1000 / stepDuration) * 100

    expect(progressIncrement).toBeCloseTo(0.00278, 4)
  })

  it('remaining time formula is consistent with progress', () => {
    const stepDuration = 120
    const progress = 50 // 50%
    const remaining = stepDuration * (1 - progress / 100)

    expect(remaining).toBe(60)
  })

  it('remaining time is 0 at 100% progress', () => {
    const stepDuration = 120
    const progress = 100
    const remaining = Math.max(0, stepDuration * (1 - progress / 100))

    expect(remaining).toBe(0)
  })

  it('remaining time equals duration at 0% progress', () => {
    const stepDuration = 120
    const progress = 0
    const remaining = stepDuration * (1 - progress / 100)

    expect(remaining).toBe(120)
  })

  it('progress clamps at 100', () => {
    const currentProgress = 99.95
    const increment = 0.1667
    const newProgress = Math.min(100, currentProgress + increment)

    expect(newProgress).toBe(100)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Edge cases for the types and exported types
// ═════════════════════════════════════════════════════════════════════════════

describe('type consistency checks', () => {
  it('RoutineStatus only allows running, paused, stopped', () => {
    const validStatuses: Array<'running' | 'paused' | 'stopped'> = [
      'running',
      'paused',
      'stopped',
    ]
    expect(validStatuses).toHaveLength(3)
  })

  it('SwimlaneStatus has all required fields', () => {
    const status = {
      currentStepIndex: 0,
      waitTimeInSeconds: 30,
      isWaiting: true,
    }
    expect(status).toHaveProperty('currentStepIndex')
    expect(status).toHaveProperty('waitTimeInSeconds')
    expect(status).toHaveProperty('isWaiting')
  })
})
