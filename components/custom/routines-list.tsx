'use client'
import React, { useState } from 'react'
import MySidebarTrigger from './sidebar-trigger'
import { Routine } from '@/models'
import { RoutineComponent } from './routine-component'
import { NoResultsComponent } from './no-results-component'
import { Repeat2Icon } from 'lucide-react'
import { Button } from '../ui/button'
import { PlusIcon } from '@radix-ui/react-icons'
import { Switch } from '../ui/switch'
import { RoutineForm } from './routine-form'
import { useRoutines } from '@/hooks/use-routines'

type RoutinesListProps = {
  initialRoutines: Routine[]
}

function RoutinesList({ initialRoutines = [] }: RoutinesListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const { routines, loading, error, addRoutine, deleteRoutine } =
    useRoutines(initialRoutines)

  const handleAddRoutine = async (newRoutine: Partial<Routine>) => {
    await addRoutine(newRoutine)
    setIsFormOpen(false)
  }

  const renderContent = () => {
    if (loading) return <p className="py-8 text-center">Loading routines...</p>

    if (error) return <p className="py-8 text-center text-red-500">{error}</p>

    if (routines.length === 0) {
      return (
        <NoResultsComponent
          icon={<Repeat2Icon />}
          title="No routines added yet"
          body={[
            'Routines are repeatable tasks that you do regularly.',
            'For example, you may have a recipe in the kitchen that requires 6 total times, some that run in parallel, and some that run in sequence.',
          ]}
          className="ml-4"
        />
      )
    }

    return routines.map((routine) => (
      <RoutineComponent
        key={routine._id}
        routine={routine}
        editMode={editMode}
        onDelete={() => deleteRoutine(routine)}
      />
    ))
  }

  return (
    <>
      <MySidebarTrigger />
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
          {renderContent()}
        </div>
      </div>
      {isFormOpen && (
        <RoutineForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddRoutine}
        />
      )}
    </>
  )
}

export default RoutinesList
