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
    <div className="flex items-center justify-between">
      <H4>Running: {routineName}</H4>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={status === 'running' ? 'outline' : 'default'}
            onClick={onPlayPause}
            className="w-full"
          >
            {status === 'running' ? (
              <>
                <PauseIcon className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" /> Resume
              </>
            )}
          </Button>
          <Button variant="destructive" className="w-full" onClick={onStop}>
            <BanIcon className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>

        {endTime && (
          <Muted className="text-right">
            Estimated completion: {endTime.toLocaleTimeString()}
          </Muted>
        )}
      </div>
    </div>
  )
}
