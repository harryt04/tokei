import { useState, useCallback, useEffect } from 'react'
import { Routine } from '@/models'
import {
  fetchRoutines,
  createRoutine,
  deleteRoutine as apiDeleteRoutine,
} from '@/lib/api'

export function useRoutines(initialRoutines: Routine[] = []) {
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines)
  const [loading, setLoading] = useState(!initialRoutines.length)
  const [error, setError] = useState<string | null>(null)

  // Only fetch if we didn't get initial data
  useEffect(() => {
    if (initialRoutines.length === 0) {
      const loadRoutines = async () => {
        setLoading(true)
        setError(null)

        try {
          const data = await fetchRoutines()
          setRoutines(data)
        } catch (err: any) {
          setError(err.message || 'Failed to fetch routines')
        } finally {
          setLoading(false)
        }
      }

      loadRoutines()
    }
  }, [initialRoutines])

  const addRoutine = useCallback(async (newRoutine: Partial<Routine>) => {
    try {
      const created = await createRoutine(newRoutine)
      setRoutines((prev) => [...prev, created])
      return created
    } catch (err: any) {
      setError(err.message || 'Failed to create routine')
      throw err
    }
  }, [])

  const deleteRoutine = useCallback(async (routine: Routine) => {
    try {
      if (!routine._id) throw new Error('Routine ID is required')

      await apiDeleteRoutine(routine._id)
      setRoutines((prev) => prev.filter((r) => r._id !== routine._id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete routine')
      throw err
    }
  }, [])

  return {
    routines,
    loading,
    error,
    addRoutine,
    deleteRoutine,
  }
}
