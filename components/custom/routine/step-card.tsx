import React from 'react'
import { RoutineStep } from '@/models'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Muted } from '../../ui/typography'
import { Progress } from '../../ui/progress'
import { Button } from '../../ui/button'
import { PlayIcon, PauseIcon, SkipForwardIcon } from 'lucide-react'
import { formatSecondsToHHMMSS } from '@/lib/utils'

interface StepCardProps {
  step: RoutineStep
  isWaiting: boolean
  isActive: boolean
  isCompleted: boolean
  isPending: boolean
  progress: number
  remainingTime: number
  showStartButton: boolean
  onManualStart: () => void
  onSkip: () => void
  onPlayPause: () => void
  isPaused: boolean
  isFirstStep: boolean
}

export default function StepCard({
  step,
  isWaiting,
  isActive,
  isCompleted,
  isPending,
  progress,
  remainingTime,
  showStartButton,
  onManualStart,
  onSkip,
  onPlayPause,
  isPaused,
  isFirstStep,
}: StepCardProps) {
  // Show skip button for active steps that are in progress or ready to start
  const showSkipButton = isActive && !isCompleted
  // Show pause button when step is actively running (has progress)
  const showPauseButton = isActive && progress > 0 && !isCompleted

  return (
    <Card
      className={`min-w-[250px] transition-shadow ${
        isActive
          ? 'border-primary shadow-lg'
          : isCompleted
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : isWaiting
              ? 'border-dashed border-amber-300 opacity-75'
              : isPending
                ? 'opacity-60'
                : ''
      }`}
    >
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-sm">
          {step.name}
          {isWaiting && isFirstStep && (
            <span className="text-xs text-amber-500">Up first</span>
          )}
          {isCompleted && (
            <span className="text-xs text-green-500">Completed</span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 p-3">
        <Muted className="text-xs">
          {isActive ? `Original duration: ` : `Duration: `}
          {formatSecondsToHHMMSS(step.durationInSeconds)}
        </Muted>

        {isWaiting && (
          <Muted className="text-xs italic">
            Start type:{' '}
            {step.startType === 'manual' ? 'Manual start' : 'Automatic'}
          </Muted>
        )}

        {isActive && progress > 0 && (
          <>
            <Progress value={progress} className="h-2" />
            <Muted className="text-xs">
              Remaining: {formatSecondsToHHMMSS(Math.round(remainingTime))}
            </Muted>
          </>
        )}

        <div className="mt-2 flex flex-1 gap-2">
          {showStartButton && (
            <Button size="sm" className="flex flex-1" onClick={onManualStart}>
              <PlayIcon className="mr-2 h-3 w-3" />
              Start
            </Button>
          )}
          {showPauseButton && (
            <Button
              size="sm"
              variant={isPaused ? 'default' : 'outline'}
              onClick={onPlayPause}
            >
              {isPaused ? (
                <>
                  <PlayIcon />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon />
                  Pause
                </>
              )}
            </Button>
          )}

          {showSkipButton && (
            <Button size="sm" variant="outline" onClick={onSkip}>
              <SkipForwardIcon />
              {progress > 0 ? 'Complete' : 'Skip'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
