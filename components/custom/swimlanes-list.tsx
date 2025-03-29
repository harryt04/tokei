'use client'
import { Routine, RoutineStep, RoutineSwimLane } from '@/models'
import React, { useState, useEffect } from 'react'
import { H4 } from '../ui/typography'
import { NoResultsComponent } from './no-results-component'
import {
  PlusIcon,
  WavesIcon,
  SaveIcon,
  CheckIcon,
  GripVerticalIcon,
  ClockIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import { v4 as uuidv4 } from 'uuid'
import { Input } from '../ui/input'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { useRoutines } from '@/hooks/use-routines'
import { toast } from '../ui/use-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import RoutineTimerComponent from './routine-timer-component'

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

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const reorderedLanes = Array.from(swimLanes)
    const [removed] = reorderedLanes.splice(result.source.index, 1)
    reorderedLanes.splice(result.destination.index, 0, removed)

    setSwimLanes(reorderedLanes)
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
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="swimlanes">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="mt-4 flex flex-col gap-4"
          >
            {swimLanes.map((swimLane, index) => (
              <Draggable
                key={swimLane.id}
                draggableId={swimLane.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`rounded-md ${snapshot.isDragging ? 'border border-primary bg-background shadow-lg' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab rounded p-1 hover:bg-muted"
                      >
                        <GripVerticalIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
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
                    </div>

                    <ScrollArea className="mt-2 h-auto w-full rounded-md border border-dashed border-muted-foreground">
                      <div className="flex w-full gap-4 p-4">
                        <Droppable
                          droppableId={`steps-${swimLane.id}`}
                          direction="horizontal"
                          type="swimlaneSteps"
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="flex gap-4"
                            >
                              {swimLane.steps &&
                                swimLane.steps.map((step, stepIndex) => (
                                  <Draggable
                                    key={step.id}
                                    draggableId={`step-${step.id}`}
                                    index={stepIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                      >
                                        <RoutineTimerComponent
                                          step={step}
                                          isDragging={snapshot.isDragging}
                                          dragHandleProps={
                                            provided.dragHandleProps
                                          }
                                          stepUpdated={(updatedStep) => {
                                            const updatedSwimLanes =
                                              swimLanes.map((lane) => {
                                                if (lane.id === swimLane.id) {
                                                  const updatedSteps = [
                                                    ...lane.steps,
                                                  ]
                                                  updatedSteps[stepIndex] =
                                                    updatedStep
                                                  return {
                                                    ...lane,
                                                    steps: updatedSteps,
                                                  }
                                                }
                                                return lane
                                              })
                                            setSwimLanes(updatedSwimLanes)
                                            setHasChanges(true)
                                          }}
                                          removeStep={(stepId) => {
                                            const updatedSwimLanes =
                                              swimLanes.map((lane) => {
                                                if (lane.id === swimLane.id) {
                                                  return {
                                                    ...lane,
                                                    steps: lane.steps.filter(
                                                      (s) => s.id !== stepId,
                                                    ),
                                                  }
                                                }
                                                return lane
                                              })
                                            setSwimLanes(updatedSwimLanes)
                                            setHasChanges(true)
                                          }}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-auto min-h-48"
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
                          }}
                        >
                          <PlusIcon />
                        </Button>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="flex">
        <AddSwimlaneButton />
        <SaveButton />
      </div>
    </DragDropContext>
  )
}
