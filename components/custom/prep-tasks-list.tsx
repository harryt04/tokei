'use client'

import React, { useState, useEffect } from 'react'
import { PrepTask, Routine, RoutineSwimLane } from '@/models'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  PlusIcon,
  Trash2Icon,
  GripVerticalIcon,
  LinkIcon,
  Link2OffIcon,
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
import { Badge } from '../ui/badge'

export type PrepTasksListProps = {
  routine: Routine
}

export function PrepTasksList({ routine }: PrepTasksListProps) {
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>(
    routine.prepTasks ?? [],
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { updateRoutine } = useRoutines([routine])

  // Track changes
  useEffect(() => {
    setHasChanges(
      JSON.stringify(prepTasks) !== JSON.stringify(routine.prepTasks ?? []),
    )
  }, [prepTasks, routine.prepTasks])

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
    setIsSaving(true)
    try {
      // Filter out empty tasks
      const validTasks = prepTasks.filter((task) => task.name.trim() !== '')
      await updateRoutine(routine._id, { prepTasks: validTasks })
      setPrepTasks(validTasks)
      toast({
        title: 'Success',
        description: 'Prep tasks saved successfully',
      })
      setHasChanges(false)
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
                        className="flex-1"
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
                        <SelectTrigger className="w-48">
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
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-destructive hover:text-destructive"
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

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </div>
  )
}
