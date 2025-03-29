import { Routine } from '@/models'

export async function fetchRoutines(): Promise<Routine[]> {
  const response = await fetch(`/api/routines`, {
    // Next.js 14 caching configurations
    cache: 'no-store', // or use revalidate option if appropriate
  })

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function createRoutine(
  newRoutine: Partial<Routine>,
): Promise<Routine> {
  const response = await fetch('/api/routine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRoutine),
  })

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.updatedRoutine
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const response = await fetch(`/api/routine?id=${routineId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`)
  }
}

export async function updateRoutine(
  routineId: string,
  updates: Partial<Routine>,
): Promise<Routine> {
  const response = await fetch(`/api/routine?id=${routineId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    console.error('Unable to update routine: ', response)
    throw new Error(`Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.updatedRoutine || data // Handle both direct return and wrapped return
}
