import React from 'react'
import { RoutineStep, RoutineSwimLane } from '@/models'
import { H4 } from '../../ui/typography'
import { ScrollArea, ScrollBar } from '../../ui/scroll-area'
import WaitingCard from './WaitingCard'
import StepCard from './StepCard'

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
}

export default function SwimlaneComponent({
  swimlane,
  status,
  waitTimeRemaining,
  stepProgress,
  remainingTimeInSeconds,
  shouldShowStartButton,
  onManualStart,
}: SwimlaneComponentProps) {
  const isWaiting = status?.isWaiting
  const currentStepIndex = status?.currentStepIndex || 0

  return (
    <div className="mt-4">
      <H4>{swimlane.name}</H4>

      <ScrollArea className="mt-2 h-auto w-full">
        <div className="flex w-full gap-4 p-4">
          {isWaiting && (
            <WaitingCard
              waitTime={waitTimeRemaining}
              totalWaitTime={status?.waitTimeInSeconds || 0}
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
              isFirstStep={index === 0}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
