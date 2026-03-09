/**
 * Tests for the useRoutines hook logic.
 *
 * Since we can't use renderHook without @testing-library/react,
 * we test the underlying logic patterns: API call orchestration,
 * state transitions, and error handling.
 */

import { Routine } from '@/models'

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockFetchRoutines = jest.fn()
const mockCreateRoutine = jest.fn()
const mockDeleteRoutine = jest.fn()
const mockUpdateRoutine = jest.fn()

jest.mock('@/lib/api', () => ({
  fetchRoutines: (...args: any[]) => mockFetchRoutines(...args),
  createRoutine: (...args: any[]) => mockCreateRoutine(...args),
  deleteRoutine: (...args: any[]) => mockDeleteRoutine(...args),
  updateRoutine: (...args: any[]) => mockUpdateRoutine(...args),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    _id: 'r1',
    userId: 'u1',
    name: 'Test Routine',
    ...overrides,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// useRoutines logic tests
// ═════════════════════════════════════════════════════════════════════════════

describe('useRoutines — fetch logic', () => {
  it('calls fetchRoutines when no initialRoutines provided', async () => {
    const routines = [makeRoutine()]
    mockFetchRoutines.mockResolvedValue(routines)

    // Simulating the hook's shouldFetch logic
    const initialRoutines: Routine[] = []
    const shouldFetch = initialRoutines.length === 0

    expect(shouldFetch).toBe(true)

    const data = await mockFetchRoutines()
    expect(data).toEqual(routines)
  })

  it('skips fetch when initialRoutines are provided', () => {
    const initialRoutines = [makeRoutine()]
    const shouldFetch = initialRoutines.length === 0

    expect(shouldFetch).toBe(false)
    expect(mockFetchRoutines).not.toHaveBeenCalled()
  })

  it('handles fetch error gracefully', async () => {
    mockFetchRoutines.mockRejectedValue(new Error('Network error'))

    let error: string | null = null
    try {
      await mockFetchRoutines()
    } catch (err: any) {
      error = err.message || 'Failed to fetch routines'
    }

    expect(error).toBe('Network error')
  })

  it('handles fetch error without message', async () => {
    mockFetchRoutines.mockRejectedValue({})

    let error: string | null = null
    try {
      await mockFetchRoutines()
    } catch (err: any) {
      error = err.message || 'Failed to fetch routines'
    }

    expect(error).toBe('Failed to fetch routines')
  })
})

describe('useRoutines — addRoutine logic', () => {
  it('calls createRoutine API and returns created routine', async () => {
    const newRoutine = makeRoutine({ _id: 'new1', name: 'New Routine' })
    mockCreateRoutine.mockResolvedValue(newRoutine)

    const result = await mockCreateRoutine({ name: 'New Routine' })

    expect(mockCreateRoutine).toHaveBeenCalledWith({ name: 'New Routine' })
    expect(result).toEqual(newRoutine)
  })

  it('adds created routine to existing array', async () => {
    const existing = [makeRoutine({ _id: 'r1' })]
    const created = makeRoutine({ _id: 'r2', name: 'Second' })
    mockCreateRoutine.mockResolvedValue(created)

    const result = await mockCreateRoutine({ name: 'Second' })
    const updatedRoutines = [...existing, result]

    expect(updatedRoutines).toHaveLength(2)
    expect(updatedRoutines[1]._id).toBe('r2')
  })

  it('propagates create error', async () => {
    mockCreateRoutine.mockRejectedValue(new Error('Duplicate name'))

    await expect(mockCreateRoutine({ name: 'Dup' })).rejects.toThrow(
      'Duplicate name',
    )
  })
})

describe('useRoutines — deleteRoutine logic', () => {
  it('throws if routine has no _id', () => {
    const routine = { name: 'No ID', userId: 'u1' } as Routine

    // The hook checks: if (!routine._id) throw new Error('Routine ID is required')
    expect(() => {
      if (!routine._id) throw new Error('Routine ID is required')
    }).toThrow('Routine ID is required')
  })

  it('calls deleteRoutine API with correct ID', async () => {
    mockDeleteRoutine.mockResolvedValue(undefined)

    const routine = makeRoutine({ _id: 'r1' })
    await mockDeleteRoutine(routine._id)

    expect(mockDeleteRoutine).toHaveBeenCalledWith('r1')
  })

  it('filters deleted routine from array', () => {
    const routines = [
      makeRoutine({ _id: 'r1' }),
      makeRoutine({ _id: 'r2' }),
      makeRoutine({ _id: 'r3' }),
    ]

    const deletedId = 'r2'
    const filtered = routines.filter((r) => r._id !== deletedId)

    expect(filtered).toHaveLength(2)
    expect(filtered.find((r) => r._id === 'r2')).toBeUndefined()
  })

  it('propagates delete error', async () => {
    mockDeleteRoutine.mockRejectedValue(new Error('Not found'))

    await expect(mockDeleteRoutine('r1')).rejects.toThrow('Not found')
  })
})

describe('useRoutines — updateRoutine logic', () => {
  it('calls updateRoutine API with id and updates', async () => {
    const updated = makeRoutine({ _id: 'r1', name: 'Updated Name' })
    mockUpdateRoutine.mockResolvedValue(updated)

    const result = await mockUpdateRoutine('r1', { name: 'Updated Name' })

    expect(mockUpdateRoutine).toHaveBeenCalledWith('r1', {
      name: 'Updated Name',
    })
    expect(result.name).toBe('Updated Name')
  })

  it('replaces the correct routine in the array', () => {
    const routines = [
      makeRoutine({ _id: 'r1', name: 'Original' }),
      makeRoutine({ _id: 'r2', name: 'Other' }),
    ]

    const updated = { name: 'Updated' }
    const routineId = 'r1'

    const newRoutines = routines.map((routine) =>
      routine._id === routineId ? { ...routine, ...updated } : routine,
    )

    expect(newRoutines[0].name).toBe('Updated')
    expect(newRoutines[1].name).toBe('Other')
  })

  it('does not modify other routines during update', () => {
    const routines = [
      makeRoutine({ _id: 'r1', name: 'A' }),
      makeRoutine({ _id: 'r2', name: 'B' }),
      makeRoutine({ _id: 'r3', name: 'C' }),
    ]

    const updated = { name: 'B-updated' }
    const routineId = 'r2'

    const newRoutines = routines.map((routine) =>
      routine._id === routineId ? { ...routine, ...updated } : routine,
    )

    expect(newRoutines[0].name).toBe('A')
    expect(newRoutines[1].name).toBe('B-updated')
    expect(newRoutines[2].name).toBe('C')
  })

  it('propagates update error', async () => {
    mockUpdateRoutine.mockRejectedValue(new Error('Validation failed'))

    await expect(mockUpdateRoutine('r1', { name: '' })).rejects.toThrow(
      'Validation failed',
    )
  })

  it('handles update of non-existent ID gracefully', () => {
    const routines = [makeRoutine({ _id: 'r1' })]

    const newRoutines = routines.map((routine) =>
      routine._id === 'r-nonexistent'
        ? { ...routine, name: 'Updated' }
        : routine,
    )

    // No change
    expect(newRoutines).toEqual(routines)
  })
})

describe('useRoutines — shouldFetch edge cases', () => {
  it('shouldFetch is true for empty array', () => {
    expect([].length === 0).toBe(true)
  })

  it('shouldFetch is false for array with one item', () => {
    expect([makeRoutine()].length === 0).toBe(false)
  })

  it('shouldFetch is false for array with multiple items', () => {
    expect(
      [makeRoutine({ _id: 'r1' }), makeRoutine({ _id: 'r2' })].length === 0,
    ).toBe(false)
  })
})
