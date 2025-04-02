'use client'
import React, { useState, useMemo } from 'react'
import MySidebarTrigger from './sidebar-trigger'
import { Routine } from '@/models'
import { RoutineComponent } from './routine-component'
import { NoResultsComponent } from './no-results-component'
import { Repeat2Icon, SearchIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { PlusIcon } from '@radix-ui/react-icons'
import { RoutineForm } from './routine-form'
import { useRoutines } from '@/hooks/use-routines'
import { Input } from '../ui/input'

type RoutinesListProps = {
  initialRoutines: Routine[]
}

function RoutinesList({ initialRoutines = [] }: RoutinesListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { routines, loading, error, addRoutine, deleteRoutine } =
    useRoutines(initialRoutines)

  // Filter and sort routines based on search term
  const filteredRoutines = useMemo(() => {
    return routines
      .filter((routine) =>
        routine.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [routines, searchTerm])

  const handleAddRoutine = async (newRoutine: Partial<Routine>) => {
    await addRoutine(newRoutine)
    setIsFormOpen(false)
  }

  const renderContent = () => {
    if (loading) return <p className="py-8 text-center">Loading routines...</p>

    if (error) return <p className="py-8 text-center text-red-500">{error}</p>

    if (filteredRoutines.length === 0) {
      if (searchTerm) {
        return (
          <NoResultsComponent
            icon={<SearchIcon />}
            title="No matching routines found"
            body={[`No routines match the search term "${searchTerm}".`]}
            className="ml-4"
          />
        )
      }

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

    return filteredRoutines.map((routine) => (
      <RoutineComponent key={routine._id} routine={routine} />
    ))
  }

  return (
    <>
      <MySidebarTrigger />
      <div className="flex flex-col">
        <div className="ml-0 mt-8 flex w-full flex-col items-center gap-4 md:ml-4 md:flex-row">
          <Button variant="default" onClick={() => setIsFormOpen(true)}>
            <PlusIcon /> Add Routine
          </Button>
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search routines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid grid-flow-row justify-center gap-8 p-4">
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
