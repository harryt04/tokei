'use client'

import { useEffect, useState } from 'react'
import { Routine } from '@/models'
import { RoutineComponent } from '@/components/custom/routine-component'
import { Button } from '@/components/ui/button'
import { PlusIcon, Repeat2Icon } from 'lucide-react'
import { RoutineForm } from '@/components/custom/routine-form'
import { Switch } from '@/components/ui/switch'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { NoResultsComponent } from '@/components/custom/no-results-component'

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const { open, isMobile } = useSidebar()

  useEffect(() => {
    const fetchRoutines = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/routines`)
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setRoutines(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch routines')
      } finally {
        setLoading(false)
      }
    }

    fetchRoutines()
  }, [])

  const handleAddRoutine = async (newRoutine: Partial<Routine>) => {
    try {
      const response = await fetch('/api/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoutine),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const responseBody = await response.json()
      setRoutines((prev) => [...prev, responseBody.updatedRoutine])
    } catch (err) {
      console.error('Error adding routine:', err)
    }
  }

  const handleDeleteRoutine = async (routine: Routine) => {
    setRoutines(routines.filter((r) => r._id !== routine._id))
  }

  const routinesList =
    routines?.length > 0 ? (
      routines.map((routine) => (
        <RoutineComponent
          key={routine._id}
          routine={routine}
          editMode={editMode}
          onDelete={handleDeleteRoutine}
        />
      ))
    ) : (
      <NoResultsComponent
        icon={<Repeat2Icon />}
        title="No routines added yet"
        body={[
          'Routines are repeatable tasks that you do regularly.',
          'For example, you may have a recipe in the kitchen that requires 6 total times, some that run in parallel, and some that run in sequence.',
        ]}
      />
    )

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {(!open || isMobile) && <SidebarTrigger className="ml-2 mt-5 p-5" />}
        <div className="flex flex-col">
          <div className="ml-0 mt-8 flex w-10/12 flex-col items-center gap-4 md:ml-8 md:flex-row">
            <Button variant="default" onClick={() => setIsFormOpen(true)}>
              <PlusIcon /> Add Routine
            </Button>
            {routines.length > 0 && (
              <div
                className="flex cursor-pointer items-center gap-2 px-8 py-2 md:absolute md:right-0 md:pr-8"
                onClick={() => setEditMode(!editMode)}
              >
                <Switch checked={editMode} />
                Edit mode
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-8 p-4">
            {loading ? (
              <p>Loading routines...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              routinesList
            )}
          </div>
        </div>
        {isFormOpen && (
          <RoutineForm
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleAddRoutine}
          />
        )}
      </SignedIn>
    </>
  )
}
