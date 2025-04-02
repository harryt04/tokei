import React from 'react'
import { RoutineStep } from '@/models'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Muted } from '../../ui/typography'
import { Progress } from '../../ui/progress'
import { Button } from '../../ui/button'
import { PlayIcon } from 'lucide-react'
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
  isFirstStep,
}: StepCardProps) {
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

        {showStartButton && (
          <Button size="sm" className="mt-2 w-full" onClick={onManualStart}>
            <PlayIcon className="mr-2 h-3 w-3" />
            Start
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
