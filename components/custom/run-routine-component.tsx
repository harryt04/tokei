'use client'
import { Routine } from '@/models'
import React, { useState, useMemo } from 'react'
import { H4 } from '../ui/typography'
import { Button } from '../ui/button'
import RoutineControls from './routine/routine-controls'
import SwimlaneComponent from './routine/swimlane-component'
import { PrepTasksChecklist } from './prep-tasks-checklist'
import { RoutineNotes } from './routine-notes'
import { useRoutineTimer } from '@/hooks/use-routine-timer'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import { ChevronDownIcon, ChevronRightIcon, StickyNoteIcon } from 'lucide-react'

export type RunRoutineComponentProps = {
  routine: Routine
  initialStatus: 'running' | 'paused'
  endTime?: Date
  onStatusChange?: (status: 'running' | 'paused' | 'stopped') => void
}

export default function RunRoutineComponent({
  routine,
  initialStatus,
  endTime,
  onStatusChange,
}: RunRoutineComponentProps) {
  const [completedPrepTaskIds, setCompletedPrepTaskIds] = useState<Set<string>>(
    new Set(),
  )
  const [notesOpen, setNotesOpen] = useState(false)

  const {
    status,
    swimlanesStatus,
    stepProgress,
    remainingTimeInSeconds,
    waitTimeRemaining,
    pausedSteps,
    estimatedEndTime,
    handlePlayPause,
    handleStop,
    handleManualStart,
    handleSkipStep,
    handleSkipWait,
    handlePauseStep,
    handleResumeStep,
    handleRestartStep,
    shouldShowStartButton,
  } = useRoutineTimer({
    routine,
    initialStatus,
    endTime,
    onStatusChange,
  })

  // Calculate which swimlanes are blocked by incomplete prep tasks
  const blockedSwimlaneIds = useMemo(() => {
    const blocked = new Set<string>()
    routine.prepTasks?.forEach((task) => {
      if (
        task.mustCompleteBeforeSwimlaneId &&
        !completedPrepTaskIds.has(task.id)
      ) {
        blocked.add(task.mustCompleteBeforeSwimlaneId)
      }
    })
    return blocked
  }, [routine.prepTasks, completedPrepTaskIds])

  const handlePrepTaskToggle = (taskId: string, completed: boolean) => {
    setCompletedPrepTaskIds((prev) => {
      const next = new Set(prev)
      if (completed) {
        next.add(taskId)
      } else {
        next.delete(taskId)
      }
      return next
    })
  }

  if (status === 'stopped') {
    return (
      <div className="p-4 text-center">
        <H4>Routine stopped</H4>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Start Over
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-2">
      <RoutineControls
        routineName={routine.name}
        status={status}
        endTime={estimatedEndTime ?? undefined}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
      />

      {/* Prep Tasks Checklist */}
      {routine.prepTasks && routine.prepTasks.length > 0 && (
        <PrepTasksChecklist
          prepTasks={routine.prepTasks}
          swimLanes={routine.swimLanes}
          completedTaskIds={completedPrepTaskIds}
          onTaskToggle={handlePrepTaskToggle}
          blockedSwimlaneIds={blockedSwimlaneIds}
        />
      )}

      {/* Notes Section (Collapsible) */}
      {routine.notes && (
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border bg-card p-3 text-sm font-medium hover:bg-accent">
            {notesOpen ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
            <StickyNoteIcon className="h-4 w-4" />
            Recipe Notes
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <RoutineNotes routine={routine} readOnly />
          </CollapsibleContent>
        </Collapsible>
      )}

      {routine.swimLanes?.map((swimlane) => (
        <SwimlaneComponent
          key={swimlane.id}
          swimlane={swimlane}
          status={swimlanesStatus[swimlane.id]}
          waitTimeRemaining={waitTimeRemaining[swimlane.id] || 0}
          stepProgress={stepProgress}
          remainingTimeInSeconds={remainingTimeInSeconds}
          shouldShowStartButton={shouldShowStartButton}
          onManualStart={handleManualStart}
          onSkipStep={handleSkipStep}
          onSkipWait={handleSkipWait}
          onPauseStep={handlePauseStep}
          onResumeStep={handleResumeStep}
          onRestartStep={handleRestartStep}
          pausedSteps={pausedSteps}
          isBlockedByPrepTask={blockedSwimlaneIds.has(swimlane.id)}
        />
      ))}
    </div>
  )
}
