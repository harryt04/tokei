import React from 'react'
import { RoutineStep } from '@/models'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Muted } from '../../ui/typography'
import { Progress } from '../../ui/progress'
import { Button } from '../../ui/button'
import {
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  RotateCcwIcon,
} from 'lucide-react'
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
  onPauseStep: () => void
  onResumeStep: () => void
  onRestartStep: () => void
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
  onPauseStep,
  onResumeStep,
  onRestartStep,
  isPaused,
  isFirstStep,
}: StepCardProps) {
  // Show skip button for active steps that are in progress or ready to start
  const showSkipButton = isActive && !isCompleted
  // Show pause/resume button when step is actively running (has progress)
  const showPauseButton = isActive && progress > 0 && !isCompleted
  // Show restart button when step has progress
  const showRestartButton = isActive && progress > 0 && !isCompleted

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
              {isPaused && ' (Paused)'}
            </Muted>
          </>
        )}

        <div className="mt-2 flex flex-col gap-2">
          {showStartButton && (
            <Button size="sm" className="w-full" onClick={onManualStart}>
              <PlayIcon className="mr-2 h-3 w-3" />
              Start
            </Button>
          )}
          {showPauseButton && (
            <Button
              size="sm"
              variant="secondary"
              onClick={isPaused ? onResumeStep : onPauseStep}
              className="w-full"
            >
              {isPaused ? (
                <>
                  <PlayIcon className="mr-1 h-3 w-3" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="mr-1 h-3 w-3" />
                  Pause
                </>
              )}
            </Button>
          )}

          {showSkipButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSkip}
              className="w-full"
            >
              <SkipForwardIcon className="mr-1 h-3 w-3" />
              {progress > 0 ? 'Complete' : 'Skip'}
            </Button>
          )}

          {showRestartButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRestartStep}
              className="w-full hover:bg-destructive"
            >
              <RotateCcwIcon className="mr-1 h-3 w-3" />
              Start Over
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
