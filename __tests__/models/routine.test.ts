import { getRoutineTotalSteps } from '@/models/routine'
import { Routine, RoutineSwimLane, RoutineStep } from '@/models'

// ─── Helper factories ────────────────────────────────────────────────────────

function makeStep(overrides: Partial<RoutineStep> = {}): RoutineStep {
  return {
    id: 'step-1',
    swimLaneId: 'lane-1',
    name: 'Test Step',
    sequence: 0,
    durationInSeconds: 60,
    startType: 'automatic',
    ...overrides,
  }
}

function makeSwimLane(id: string, stepCount: number): RoutineSwimLane {
  return {
    id,
    name: `Lane ${id}`,
    steps: Array.from({ length: stepCount }, (_, i) =>
      makeStep({ id: `${id}-step-${i}`, swimLaneId: id, sequence: i }),
    ),
  }
}

function makeRoutine(swimLanes?: RoutineSwimLane[]): Routine {
  return {
    _id: 'routine-1',
    userId: 'user-1',
    name: 'Test Routine',
    swimLanes,
  }
}

// ─── getRoutineTotalSteps ────────────────────────────────────────────────────

describe('getRoutineTotalSteps', () => {
  it('returns 0 when routine has no swimLanes', () => {
    expect(getRoutineTotalSteps(makeRoutine(undefined))).toBe(0)
  })

  it('returns 0 when routine has empty swimLanes array', () => {
    expect(getRoutineTotalSteps(makeRoutine([]))).toBe(0)
  })

  it('counts steps in a single swim lane', () => {
    const routine = makeRoutine([makeSwimLane('a', 3)])
    expect(getRoutineTotalSteps(routine)).toBe(3)
  })

  it('sums steps across multiple swim lanes', () => {
    const routine = makeRoutine([
      makeSwimLane('a', 2),
      makeSwimLane('b', 5),
      makeSwimLane('c', 1),
    ])
    expect(getRoutineTotalSteps(routine)).toBe(8)
  })

  it('handles swim lanes with zero steps', () => {
    const routine = makeRoutine([
      makeSwimLane('a', 3),
      { id: 'empty', name: 'Empty Lane', steps: [] },
    ])
    expect(getRoutineTotalSteps(routine)).toBe(3)
  })
})

// ─── Type shape tests ────────────────────────────────────────────────────────

describe('Routine type shape', () => {
  it('a minimal routine only requires _id, userId, and name', () => {
    const routine: Routine = {
      _id: '1',
      userId: 'u1',
      name: 'Minimal',
    }
    expect(routine.swimLanes).toBeUndefined()
    expect(routine.prepTasks).toBeUndefined()
    expect(routine.notes).toBeUndefined()
    expect(routine.syncConfig).toBeUndefined()
  })

  it('accepts all optional fields', () => {
    const routine: Routine = {
      _id: '1',
      userId: 'u1',
      name: 'Full',
      swimLanes: [makeSwimLane('a', 1)],
      prepTasks: [{ id: 'p1', name: 'Prep 1' }],
      notes: 'Some notes',
      syncConfig: { syncAll: true },
    }
    expect(routine.swimLanes).toHaveLength(1)
    expect(routine.prepTasks).toHaveLength(1)
    expect(routine.notes).toBe('Some notes')
    expect(routine.syncConfig?.syncAll).toBe(true)
  })

  it('RoutineStep startType must be automatic or manual', () => {
    const automatic = makeStep({ startType: 'automatic' })
    const manual = makeStep({ startType: 'manual' })
    expect(automatic.startType).toBe('automatic')
    expect(manual.startType).toBe('manual')
  })
})
