'use client'
import { Routine, RoutineStep, RoutineSwimLane } from '@/models'
import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
} from 'react'
import { H4, Muted } from '../ui/typography'
import { NoResultsComponent } from './no-results-component'
import {
  PlusIcon,
  WavesIcon,
  SaveIcon,
  CheckIcon,
  GripVerticalIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import { v4 as uuidv4 } from 'uuid'
import { Input } from '../ui/input'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { useRoutines } from '@/hooks/use-routines'
import { toast } from '../ui/use-toast'
import {
  applySortableOrder,
  SortableHandle,
  SortableItem,
  SortableList,
} from '../ui/sortable'
import RoutineTimerComponent from './routine-timer-component'
import { calculateSwimLaneRunTimes, formatSecondsToHHMMSS } from '@/lib/utils'

export type SwimlanesListProps = {
  routine: Routine
  onCountChange?: (count: number) => void
  onRoutineChange?: (updatedRoutine: Partial<Routine>) => void
}

export type SwimlanesListHandle = {
  saveIfDirty: () => Promise<void>
  hasUnsavedChanges: () => boolean
}

export const SwimlanesList = forwardRef<
  SwimlanesListHandle,
  SwimlanesListProps
>(function SwimlanesList({ routine, onCountChange, onRoutineChange }, ref) {
  const [swimLanes, setSwimLanes] = useState<RoutineSwimLane[]>(
    routine.swimLanes ?? [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const addButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const { updateRoutine } = useRoutines([routine])

  // Notify parent of count changes
  useEffect(() => {
    onCountChange?.(swimLanes.length)
  }, [swimLanes.length, onCountChange])

  // Track changes to swimLanes
  useEffect(() => {
    setHasChanges(
      JSON.stringify(swimLanes) !== JSON.stringify(routine.swimLanes),
    )
  }, [swimLanes, routine.swimLanes])

  // Expose imperative methods for parent component
  useImperativeHandle(ref, () => ({
    saveIfDirty: async () => {
      if (hasChanges && !isSaving) {
        await handleSaveToDatabase()
      }
    },
    hasUnsavedChanges: () => hasChanges,
  }))

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
    if (isSaving) return
    setIsSaving(true)
    try {
      await updateRoutine(routine._id, {
        swimLanes: swimLanes,
      })
      // Notify parent of the updated routine
      onRoutineChange?.({ swimLanes: swimLanes })
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

  const updateSteps = (
    laneId: string,
    update: (steps: RoutineStep[]) => RoutineStep[],
  ) => {
    setSwimLanes((current) =>
      current.map((lane) =>
        lane.id === laneId
          ? { ...lane, steps: update(lane.steps ?? []) }
          : lane,
      ),
    )
  }

  const scrollToEnd = (swimLaneId: string) => {
    // Set a slight delay to ensure the DOM has updated with the new step
    setTimeout(() => {
      const scrollArea = document.querySelector(
        `[data-swimlane-id="${swimLaneId}"] [data-tokei-scroll-viewport]`,
      )
      if (scrollArea) {
        scrollArea.scrollLeft = scrollArea.scrollWidth
      }
    }, 50)
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
      className="mt-4 mr-2"
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
  const swimLanesRunTimes = calculateSwimLaneRunTimes(swimLanes)

  const lanesById = new Map(swimLanes.map((lane) => [lane.id, lane]))

  return (
    <>
      <SortableList
        aria-label="Swimlanes"
        value={Array.from(lanesById.keys())}
        label={(id) => lanesById.get(id)?.name.trim() || 'swimlane'}
        onValueChange={(order) =>
          setSwimLanes((current) => applySortableOrder(current, order))
        }
        className="mt-4 flex flex-col gap-4"
      >
        {(id) => {
          const swimLane = lanesById.get(id)
          if (!swimLane) return null
          const stepsById = new Map(
            (swimLane.steps ?? []).map((step) => [step.id, step]),
          )

          return (
            <SortableItem
              value={id}
              className="rounded-md data-[tokei-dragging]:bg-background data-[tokei-dragging]:shadow-lg data-[tokei-dragging]:ring-1 data-[tokei-dragging]:ring-primary"
              data-swimlane-id={id}
            >
              <div className="flex items-center gap-2">
                <SortableHandle
                  aria-label={`Reorder ${swimLane.name.trim() || 'swimlane'}`}
                  className="p-1 hover:bg-muted"
                >
                  <GripVerticalIcon className="h-5 w-5 text-muted-foreground" />
                </SortableHandle>
                {editingId === swimLane.id ? (
                  <Input
                    value={editValue}
                    onValueChange={(value) => setEditValue(value)}
                    onBlur={() => handleSave(swimLane.id)}
                    onKeyDown={(e) => handleKeyDown(e, swimLane.id)}
                    className="font-semibold"
                  />
                ) : (
                  <>
                    <H4
                      onClick={() => handleEdit(swimLane)}
                      className="cursor-pointer transition-colors hover:text-primary"
                    >
                      {swimLane.name}
                    </H4>
                    <Muted>
                      {`${swimLane.steps?.length ?? 0} total steps - total time: ${formatSecondsToHHMMSS(
                        swimLanesRunTimes[swimLane.id],
                      )}`}
                    </Muted>
                  </>
                )}
              </div>

              <div className="relative mt-2">
                <ScrollArea className="h-auto w-full rounded-md border border-dashed border-muted-foreground">
                  <div className="flex min-h-56 w-full gap-4 p-4 pr-16">
                    <SortableList
                      aria-label={`Steps in ${swimLane.name}`}
                      orientation="horizontal"
                      preview
                      value={Array.from(stepsById.keys())}
                      label={(key) => stepsById.get(key)?.name.trim() || 'step'}
                      onValueChange={(order) =>
                        updateSteps(id, (steps) =>
                          applySortableOrder(steps, order),
                        )
                      }
                      className="flex gap-4"
                    >
                      {(key) => {
                        const step = stepsById.get(key)
                        if (!step) return null

                        return (
                          <SortableItem value={key} className="group/step">
                            <RoutineTimerComponent
                              step={step}
                              stepUpdated={(updatedStep) =>
                                updateSteps(id, (steps) =>
                                  steps.map((item) =>
                                    item.id === key ? updatedStep : item,
                                  ),
                                )
                              }
                              removeStep={(stepId) =>
                                updateSteps(id, (steps) =>
                                  steps.filter((item) => item.id !== stepId),
                                )
                              }
                            />
                          </SortableItem>
                        )
                      }}
                    </SortableList>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Fixed position add button that's always visible */}
                <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-auto min-h-48 shadow-md"
                    onClick={() => {
                      const newStep: RoutineStep = {
                        id: uuidv4(),
                        swimLaneId: swimLane.id,
                        name: `Step ${(swimLane.steps?.length || 0) + 1}`,
                        sequence: (swimLane.steps?.length || 0) + 1,
                        durationInSeconds: 60,
                        startType: 'automatic',
                      }

                      const updatedSwimLanes = swimLanes.map((lane) => {
                        if (lane.id === swimLane.id) {
                          return {
                            ...lane,
                            steps: [...(lane.steps || []), newStep],
                          }
                        }
                        return lane
                      })

                      setSwimLanes(updatedSwimLanes)
                      setHasChanges(true)
                      scrollToEnd(swimLane.id)
                    }}
                    ref={(el) => {
                      addButtonRefs.current[swimLane.id] = el
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </div>
            </SortableItem>
          )
        }}
      </SortableList>

      <div className="flex">
        <AddSwimlaneButton />
        <SaveButton />
      </div>
    </>
  )
})
