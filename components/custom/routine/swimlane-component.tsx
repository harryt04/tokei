import React from 'react'
import { RoutineStep, RoutineSwimLane } from '@/models'
import { H4 } from '../../ui/typography'
import { ScrollArea, ScrollBar } from '../../ui/scroll-area'
import WaitingCard from './waiting-card'
import StepCard from './step-card'
import { Badge } from '../../ui/badge'
import { AlertCircleIcon } from 'lucide-react'

interface SwimlaneComponentProps {
  swimlane: RoutineSwimLane
  status:
    | {
        currentStepIndex: number
        waitTimeInSeconds: number
        isWaiting: boolean
      }
    | undefined
  waitTimeRemaining: number
  stepProgress: Record<string, number>
  remainingTimeInSeconds: Record<string, number>
  shouldShowStartButton: (step: RoutineStep) => boolean
  onManualStart: (stepId: string) => void
  onSkipStep: (stepId: string) => void
  onSkipWait: (swimlaneId: string) => void
  isBlockedByPrepTask?: boolean
}

export default function SwimlaneComponent({
  swimlane,
  status,
  waitTimeRemaining,
  stepProgress,
  remainingTimeInSeconds,
  shouldShowStartButton,
  onManualStart,
  onSkipStep,
  onSkipWait,
  isBlockedByPrepTask = false,
}: SwimlaneComponentProps) {
  const isWaiting = status?.isWaiting
  const currentStepIndex = status?.currentStepIndex || 0

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <H4>{swimlane.name}</H4>
        {isBlockedByPrepTask && (
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          >
            <AlertCircleIcon className="mr-1 h-3 w-3" />
            Waiting for prep task
          </Badge>
        )}
      </div>

      <ScrollArea className="mt-2 h-auto w-full">
        <div className="flex w-full gap-4 p-4">
          {isWaiting && (
            <WaitingCard
              waitTime={waitTimeRemaining}
              totalWaitTime={status?.waitTimeInSeconds || 0}
              onSkip={() => onSkipWait(swimlane.id)}
            />
          )}

          {swimlane.steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              isWaiting={!!isWaiting}
              isActive={!isWaiting && currentStepIndex === index}
              isCompleted={!isWaiting && index < currentStepIndex}
              isPending={!!isWaiting || index > currentStepIndex}
              progress={
                !isWaiting && currentStepIndex === index
                  ? stepProgress[step.id] || 0
                  : 0
              }
              remainingTime={
                !isWaiting && currentStepIndex === index
                  ? remainingTimeInSeconds[step.id] || step.durationInSeconds
                  : 0
              }
              showStartButton={shouldShowStartButton(step)}
              onManualStart={() => onManualStart(step.id)}
              onSkip={() => onSkipStep(step.id)}
              isFirstStep={index === 0}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
