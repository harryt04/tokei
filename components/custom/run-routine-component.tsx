'use client'
import { Routine } from '@/models'
import React from 'react'
import { H4 } from '../ui/typography'
import { Button } from '../ui/button'
import RoutineControls from './routine/RoutineControls'
import SwimlaneComponent from './routine/SwimlaneComponent'
import { useRoutineTimer } from '@/hooks/use-routine-timer'

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
  const {
    status,
    swimlanesStatus,
    stepProgress,
    remainingTimeInSeconds,
    waitTimeRemaining,
    handlePlayPause,
    handleStop,
    handleManualStart,
    shouldShowStartButton,
  } = useRoutineTimer({
    routine,
    initialStatus,
    endTime,
    onStatusChange,
  })

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
        endTime={endTime}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
      />

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
        />
      ))}
    </div>
  )
}
