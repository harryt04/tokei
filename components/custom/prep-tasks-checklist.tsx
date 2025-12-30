'use client'

import React from 'react'
import { PrepTask, RoutineSwimLane } from '@/models'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Muted } from '../ui/typography'

export type PrepTasksChecklistProps = {
  prepTasks: PrepTask[]
  swimLanes?: RoutineSwimLane[]
  completedTaskIds: Set<string>
  onTaskToggle: (taskId: string, completed: boolean) => void
  // Which swimlanes are currently blocked waiting for prep tasks
  blockedSwimlaneIds?: Set<string>
}

export function PrepTasksChecklist({
  prepTasks,
  swimLanes,
  completedTaskIds,
  onTaskToggle,
  blockedSwimlaneIds,
}: PrepTasksChecklistProps) {
  const getSwimlaneName = (swimlaneId?: string) => {
    if (!swimlaneId) return null
    const swimlane = swimLanes?.find((sl) => sl.id === swimlaneId)
    return swimlane?.name ?? 'Unknown'
  }

  // Separate tasks into blocking (has dependency) and non-blocking
  const blockingTasks = prepTasks.filter(
    (task) => task.mustCompleteBeforeSwimlaneId,
  )
  const nonBlockingTasks = prepTasks.filter(
    (task) => !task.mustCompleteBeforeSwimlaneId,
  )

  const completedCount = completedTaskIds.size
  const totalCount = prepTasks.length

  if (prepTasks.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            Prep Tasks
            {completedCount === totalCount ? (
              <CheckCircle2Icon className="h-4 w-4 text-green-500" />
            ) : (
              <Badge variant="secondary" className="ml-2">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Blocking tasks first */}
        {blockingTasks.length > 0 && (
          <div className="space-y-2">
            {blockingTasks.map((task) => {
              const isCompleted = completedTaskIds.has(task.id)
              const isBlocking = blockedSwimlaneIds?.has(
                task.mustCompleteBeforeSwimlaneId!,
              )
              const swimlaneName = getSwimlaneName(
                task.mustCompleteBeforeSwimlaneId,
              )

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-md border p-2 ${
                    isBlocking && !isCompleted
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                      : ''
                  }`}
                >
                  <Checkbox
                    id={task.id}
                    checked={isCompleted}
                    onCheckedChange={(checked) =>
                      onTaskToggle(task.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={task.id}
                    className={`flex-1 cursor-pointer ${
                      isCompleted ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {task.name}
                  </Label>
                  <Badge
                    variant={isCompleted ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {isBlocking && !isCompleted && (
                      <AlertCircleIcon className="mr-1 h-3 w-3 text-amber-500" />
                    )}
                    Before: {swimlaneName}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}

        {/* Non-blocking tasks */}
        {nonBlockingTasks.length > 0 && (
          <div className="space-y-2">
            {blockingTasks.length > 0 && (
              <Muted className="text-xs">Anytime tasks:</Muted>
            )}
            {nonBlockingTasks.map((task) => {
              const isCompleted = completedTaskIds.has(task.id)

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-md border p-2"
                >
                  <Checkbox
                    id={task.id}
                    checked={isCompleted}
                    onCheckedChange={(checked) =>
                      onTaskToggle(task.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={task.id}
                    className={`flex-1 cursor-pointer ${
                      isCompleted ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {task.name}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
