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
      <RoutineComponent key={routine._id} routine={routine} />
    ))
  }

  return (
    <>
      <MySidebarTrigger />
      <div className="flex flex-col">
        <div className="ml-0 mt-8 flex w-10/12 flex-col items-center gap-4 md:ml-4 md:flex-row">
          <Button variant="default" onClick={() => setIsFormOpen(true)}>
            <PlusIcon /> Add Routine
          </Button>
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
