import React from 'react'
import { H4, Muted } from '../../ui/typography'
import { Button } from '../../ui/button'
import { BanIcon, PauseIcon, PlayIcon } from 'lucide-react'

interface RoutineControlsProps {
  routineName: string
  status: 'running' | 'paused' | 'stopped'
  endTime?: Date
  onPlayPause: () => void
  onStop: () => void
}

export default function RoutineControls({
  routineName,
  status,
  endTime,
  onPlayPause,
  onStop,
}: RoutineControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <H4 className="truncate text-base sm:text-lg">
          Running: {routineName}
        </H4>
        {endTime && (
          <Muted className="text-xs sm:text-sm">
            ETC:{' '}
            {endTime.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Muted>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="default"
          onClick={onPlayPause}
          size="sm"
          className="flex-1 sm:flex-none"
        >
          {status === 'running' ? (
            <>
              <PauseIcon className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Resume</span>
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onStop}
          className="flex-1 sm:flex-none"
        >
          <BanIcon className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Cancel</span>
        </Button>
      </div>
    </div>
  )
}
