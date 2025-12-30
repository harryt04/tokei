'use client'

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react'
import { PrepTask, Routine } from '@/models'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  PlusIcon,
  GripVerticalIcon,
  LinkIcon,
  Link2OffIcon,
  SaveIcon,
  CheckIcon,
  Trash2Icon,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Muted } from '../ui/typography'
import { useRoutines } from '@/hooks/use-routines'
import { toast } from '../ui/use-toast'

export type PrepTasksListProps = {
  routine: Routine
  onCountChange?: (count: number) => void
  onRoutineChange?: (updatedRoutine: Partial<Routine>) => void
}

export type PrepTasksListHandle = {
  saveIfDirty: () => Promise<void>
  hasUnsavedChanges: () => boolean
}

export const PrepTasksList = forwardRef<
  PrepTasksListHandle,
  PrepTasksListProps
>(function PrepTasksList({ routine, onCountChange, onRoutineChange }, ref) {
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>(
    routine.prepTasks ?? [],
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { updateRoutine } = useRoutines([routine])

  // Sync local state when routine.prepTasks changes from parent
  // This handles remount scenarios and external updates
  useEffect(() => {
    setPrepTasks(routine.prepTasks ?? [])
  }, [routine.prepTasks])

  // Notify parent of count changes
  useEffect(() => {
    onCountChange?.(prepTasks.length)
  }, [prepTasks.length, onCountChange])

  // Track changes
  useEffect(() => {
    setHasChanges(
      JSON.stringify(prepTasks) !== JSON.stringify(routine.prepTasks ?? []),
    )
  }, [prepTasks, routine.prepTasks])

  // Expose imperative methods for parent component
  useImperativeHandle(ref, () => ({
    saveIfDirty: async () => {
      if (hasChanges && !isSaving) {
        await handleSave()
      }
    },
    hasUnsavedChanges: () => hasChanges,
  }))

  const handleAddTask = () => {
    const newTask: PrepTask = {
      id: uuidv4(),
      name: '',
    }
    setPrepTasks([...prepTasks, newTask])
  }
  const handleUpdateTask = (id: string, updates: Partial<PrepTask>) => {
    setPrepTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    )
  }

  const handleDeleteTask = (id: string) => {
    setPrepTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const reordered = Array.from(prepTasks)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)

    setPrepTasks(reordered)
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      // Filter out empty tasks
      const validTasks = prepTasks.filter((task) => task.name.trim() !== '')
      await updateRoutine(routine._id, { prepTasks: validTasks })
      setPrepTasks(validTasks)
      // Notify parent of the updated routine
      onRoutineChange?.({ prepTasks: validTasks })
      toast({
        title: 'Success',
        description: 'Prep tasks saved successfully',
      })
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save prep tasks',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getSwimlaneName = (swimlaneId?: string) => {
    if (!swimlaneId) return null
    const swimlane = routine.swimLanes?.find((sl) => sl.id === swimlaneId)
    return swimlane?.name ?? 'Unknown'
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="prep-tasks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {prepTasks.length === 0 && (
                <Muted className="py-4 text-center">
                  No prep tasks yet. Prep tasks are things you can do before or
                  during your routine, like &quot;grate cheese&quot; or
                  &quot;chop onions&quot;. They don&apos;t have a timer—just
                  check them off when done.
                </Muted>
              )}

              {prepTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-2 rounded-md border bg-card p-2 ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab text-muted-foreground"
                      >
                        <GripVerticalIcon className="h-4 w-4" />
                      </div>

                      <Input
                        value={task.name}
                        onChange={(e) =>
                          handleUpdateTask(task.id, { name: e.target.value })
                        }
                        placeholder="Task name (e.g., Grate cheese)"
                        className="flex-[2]"
                      />

                      <Select
                        value={task.mustCompleteBeforeSwimlaneId ?? 'none'}
                        onValueChange={(value) =>
                          handleUpdateTask(task.id, {
                            mustCompleteBeforeSwimlaneId:
                              value === 'none' ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="flex-[1]">
                          <SelectValue placeholder="Complete before..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="flex items-center gap-2">
                              <Link2OffIcon className="h-3 w-3" />
                              No dependency
                            </span>
                          </SelectItem>
                          {routine.swimLanes?.map((swimlane) => (
                            <SelectItem key={swimlane.id} value={swimlane.id}>
                              <span className="flex items-center gap-2">
                                <LinkIcon className="h-3 w-3" />
                                Before: {swimlane.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        variant="outline"
                        className="hover:bg-destructive"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleAddTask}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Prep Task
        </Button>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="sm"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : saveSuccess ? (
            <>
              <CheckIcon className="mr-1 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <SaveIcon className="mr-1 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
})
