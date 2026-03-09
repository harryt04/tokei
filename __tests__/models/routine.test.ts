import { getRoutineTotalSteps } from '@/models/routine'
import {
  Routine,
  RoutineSwimLane,
  RoutineStep,
  PrepTask,
  SwimLaneSyncConfig,
  SyncGroup,
} from '@/models'

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

function makeRoutine(
  overrides: Partial<Routine> = {},
  swimLanes?: RoutineSwimLane[],
): Routine {
  return {
    _id: 'routine-1',
    userId: 'user-1',
    name: 'Test Routine',
    swimLanes,
    ...overrides,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// getRoutineTotalSteps
// ═════════════════════════════════════════════════════════════════════════════

describe('getRoutineTotalSteps', () => {
  it('returns 0 when routine has no swimLanes (undefined)', () => {
    expect(getRoutineTotalSteps(makeRoutine())).toBe(0)
  })

  it('returns 0 when routine has empty swimLanes array', () => {
    expect(getRoutineTotalSteps(makeRoutine({}, []))).toBe(0)
  })

  it('counts steps in a single swim lane', () => {
    const routine = makeRoutine({}, [makeSwimLane('a', 3)])
    expect(getRoutineTotalSteps(routine)).toBe(3)
  })

  it('sums steps across multiple swim lanes', () => {
    const routine = makeRoutine({}, [
      makeSwimLane('a', 2),
      makeSwimLane('b', 5),
      makeSwimLane('c', 1),
    ])
    expect(getRoutineTotalSteps(routine)).toBe(8)
  })

  it('handles swim lanes with zero steps', () => {
    const routine = makeRoutine({}, [
      makeSwimLane('a', 3),
      { id: 'empty', name: 'Empty Lane', steps: [] },
    ])
    expect(getRoutineTotalSteps(routine)).toBe(3)
  })

  it('handles a single swim lane with one step', () => {
    const routine = makeRoutine({}, [makeSwimLane('a', 1)])
    expect(getRoutineTotalSteps(routine)).toBe(1)
  })

  it('handles many swim lanes with many steps', () => {
    const lanes = Array.from({ length: 10 }, (_, i) =>
      makeSwimLane(`lane-${i}`, 10),
    )
    const routine = makeRoutine({}, lanes)
    expect(getRoutineTotalSteps(routine)).toBe(100)
  })

  it('handles all swim lanes having zero steps', () => {
    const routine = makeRoutine({}, [
      { id: 'a', name: 'A', steps: [] },
      { id: 'b', name: 'B', steps: [] },
      { id: 'c', name: 'C', steps: [] },
    ])
    expect(getRoutineTotalSteps(routine)).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Routine type shape and structure
// ═════════════════════════════════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════════════════════════════════
// PrepTask structure
// ═════════════════════════════════════════════════════════════════════════════

describe('PrepTask', () => {
  it('can have just id and name', () => {
    const task: PrepTask = { id: 'p1', name: 'Get supplies' }
    expect(task.mustCompleteBeforeSwimlaneId).toBeUndefined()
  })

  it('can reference a swim lane via mustCompleteBeforeSwimlaneId', () => {
    const task: PrepTask = {
      id: 'p1',
      name: 'Boil water',
      mustCompleteBeforeSwimlaneId: 'lane-cooking',
    }
    expect(task.mustCompleteBeforeSwimlaneId).toBe('lane-cooking')
  })

  it('routine can have multiple prep tasks with mixed configurations', () => {
    const routine: Routine = {
      _id: '1',
      userId: 'u1',
      name: 'Complex',
      prepTasks: [
        { id: 'p1', name: 'No blocking' },
        { id: 'p2', name: 'Blocks lane A', mustCompleteBeforeSwimlaneId: 'a' },
        { id: 'p3', name: 'Blocks lane B', mustCompleteBeforeSwimlaneId: 'b' },
      ],
    }
    expect(routine.prepTasks).toHaveLength(3)
    expect(routine.prepTasks![0].mustCompleteBeforeSwimlaneId).toBeUndefined()
    expect(routine.prepTasks![1].mustCompleteBeforeSwimlaneId).toBe('a')
    expect(routine.prepTasks![2].mustCompleteBeforeSwimlaneId).toBe('b')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// SwimLaneSyncConfig and SyncGroup structure
// ═════════════════════════════════════════════════════════════════════════════

describe('SwimLaneSyncConfig', () => {
  it('can be configured with syncAll only', () => {
    const config: SwimLaneSyncConfig = { syncAll: true }
    expect(config.syncAll).toBe(true)
    expect(config.syncGroups).toBeUndefined()
  })

  it('can be configured with syncAll false', () => {
    const config: SwimLaneSyncConfig = { syncAll: false }
    expect(config.syncAll).toBe(false)
  })

  it('can have sync groups with named groups', () => {
    const config: SwimLaneSyncConfig = {
      syncAll: false,
      syncGroups: [
        { id: 'g1', name: 'Morning tasks', swimLaneIds: ['a', 'b'] },
        { id: 'g2', name: 'Evening tasks', swimLaneIds: ['c'] },
      ],
    }
    expect(config.syncGroups).toHaveLength(2)
    expect(config.syncGroups![0].swimLaneIds).toEqual(['a', 'b'])
  })

  it('SyncGroup name is optional', () => {
    const group: SyncGroup = { id: 'g1', swimLaneIds: ['a', 'b'] }
    expect(group.name).toBeUndefined()
    expect(group.swimLaneIds).toHaveLength(2)
  })

  it('SyncGroup can have empty swimLaneIds', () => {
    const group: SyncGroup = { id: 'g1', swimLaneIds: [] }
    expect(group.swimLaneIds).toHaveLength(0)
  })

  it('routine accepts syncConfig with full configuration', () => {
    const routine: Routine = {
      _id: '1',
      userId: 'u1',
      name: 'Synced',
      swimLanes: [makeSwimLane('a', 2), makeSwimLane('b', 3)],
      syncConfig: {
        syncAll: false,
        syncGroups: [{ id: 'g1', swimLaneIds: ['a', 'b'] }],
      },
    }
    expect(routine.syncConfig?.syncAll).toBe(false)
    expect(routine.syncConfig?.syncGroups).toHaveLength(1)
    expect(routine.syncConfig?.syncGroups![0].swimLaneIds).toContain('a')
    expect(routine.syncConfig?.syncGroups![0].swimLaneIds).toContain('b')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// RoutineStep detailed tests
// ═════════════════════════════════════════════════════════════════════════════

describe('RoutineStep', () => {
  it('has all required fields', () => {
    const step = makeStep()
    expect(step.id).toBeDefined()
    expect(step.swimLaneId).toBeDefined()
    expect(step.name).toBeDefined()
    expect(typeof step.sequence).toBe('number')
    expect(typeof step.durationInSeconds).toBe('number')
    expect(['automatic', 'manual']).toContain(step.startType)
  })

  it('can have zero duration', () => {
    const step = makeStep({ durationInSeconds: 0 })
    expect(step.durationInSeconds).toBe(0)
  })

  it('can have very large duration', () => {
    const step = makeStep({ durationInSeconds: 86400 }) // 24 hours
    expect(step.durationInSeconds).toBe(86400)
  })

  it('sequence values track step ordering', () => {
    const steps = [
      makeStep({ id: 's0', sequence: 0 }),
      makeStep({ id: 's1', sequence: 1 }),
      makeStep({ id: 's2', sequence: 2 }),
    ]
    expect(steps.map((s) => s.sequence)).toEqual([0, 1, 2])
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// RoutineSwimLane structure
// ═════════════════════════════════════════════════════════════════════════════

describe('RoutineSwimLane', () => {
  it('can have an empty steps array', () => {
    const lane: RoutineSwimLane = { id: 'l1', name: 'Empty', steps: [] }
    expect(lane.steps).toHaveLength(0)
  })

  it('steps reference the parent swim lane id', () => {
    const lane = makeSwimLane('parent', 3)
    lane.steps.forEach((step) => {
      expect(step.swimLaneId).toBe('parent')
    })
  })

  it('step sequences are consecutive starting from 0', () => {
    const lane = makeSwimLane('a', 5)
    expect(lane.steps.map((s) => s.sequence)).toEqual([0, 1, 2, 3, 4])
  })
})
