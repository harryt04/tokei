'use client'
import { Routine, RoutineSwimLane } from '@/models'
import React, { useState, useEffect } from 'react'
import { H4 } from '../ui/typography'
import { NoResultsComponent } from './no-results-component'
import { PlusIcon, WavesIcon, SaveIcon, CheckIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { v4 as uuidv4 } from 'uuid'
import { Input } from '../ui/input'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { useRoutines } from '@/hooks/use-routines'
import { toast } from '../ui/use-toast'

export type SwimlanesListProps = {
  routine: Routine
}
export function SwimlanesList(props: SwimlanesListProps) {
  const [swimLanes, setSwimLanes] = useState<RoutineSwimLane[]>(
    props.routine.swimLanes ?? [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { updateRoutine } = useRoutines([props.routine])

  // Track changes to swimLanes
  useEffect(() => {
    setHasChanges(
      JSON.stringify(swimLanes) !== JSON.stringify(props.routine.swimLanes),
    )
  }, [swimLanes, props.routine.swimLanes])

  const handleEdit = (swimLane: RoutineSwimLane) => {
    setEditingId(swimLane.id)
    setEditValue(swimLane.name)
  }

  const handleSave = (id: string) => {
    setSwimLanes((prevLanes) =>
      prevLanes.map((lane) =>
        lane.id === id ? { ...lane, name: editValue } : lane,
      ),
    )
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSave(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  const handleSaveToDatabase = async () => {
    setIsSaving(true)
    try {
      await updateRoutine(props.routine._id, {
        swimLanes: swimLanes,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      toast({
        title: 'Success',
        description: 'Swimlanes saved successfully',
      })
      setHasChanges(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save swimlanes',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const AddSwimlaneButton = () => (
    <Button
      variant="outline"
      onClick={() => {
        setSwimLanes((existingSwimLanes) => [
          ...existingSwimLanes,
          {
            id: uuidv4(),
            name: `Swimlane ${existingSwimLanes.length + 1}`,
            steps: [],
          },
        ])
      }}
      className="mr-2 mt-4"
    >
      <PlusIcon className="mr-1" />
      Add swimlane
    </Button>
  )

  const SaveButton = () => (
    <Button
      variant="default"
      onClick={handleSaveToDatabase}
      className="mt-4"
      disabled={!hasChanges || isSaving}
    >
      {isSaving ? (
        <span className="animate-pulse">Saving...</span>
      ) : saveSuccess ? (
        <>
          <CheckIcon className="mr-1" />
          Saved
        </>
      ) : (
        <>
          <SaveIcon className="mr-1" />
          Save changes
        </>
      )}
    </Button>
  )

  if (!swimLanes || swimLanes.length === 0)
    return (
      <>
        <NoResultsComponent
          icon={<WavesIcon />}
          title={'No swimlanes created yet'}
          body={[
            'A swimlane is any collection of timers that need to run sequentially.',
            'Swimlanes run in parallel, and can be configured to complete at the same time.',
            'Click Add Swimlane to get started',
          ]}
          className="mt-4"
        />
        <AddSwimlaneButton />
      </>
    )

  return (
    <>
      {swimLanes?.map((swimLane) => {
        return (
          <div key={swimLane.id} className="mb-4">
            {editingId === swimLane.id ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSave(swimLane.id)}
                onKeyDown={(e) => handleKeyDown(e, swimLane.id)}
                autoFocus
                className="font-semibold"
              />
            ) : (
              <H4
                onClick={() => handleEdit(swimLane)}
                className="cursor-pointer transition-colors hover:text-primary"
              >
                {swimLane.name}
              </H4>
            )}

            <ScrollArea className="mt-2 h-36 w-full rounded-md border border-dashed border-muted-foreground">
              <div className="flex w-full gap-4 p-4">
                {/* Placeholder items that will be replaced with actual timers */}
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 1
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 2
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 3
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 4
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 5
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 6
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 1
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 2
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 3
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 4
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 5
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 6
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 1
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 2
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 3
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 4
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 5
                </div>
                <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-sm">
                  Timer 6
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )
      })}
      <div className="flex">
        <AddSwimlaneButton />
        <SaveButton />
      </div>
    </>
  )
}
