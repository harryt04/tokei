'use client'
import { Routine, RoutineStep } from '@/models'
import React, { useState, useEffect, useRef } from 'react'
import { H4, Muted } from '../ui/typography'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { PauseIcon, PlayIcon, StopCircleIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatSecondsToHHMMSS } from '@/lib/utils'
import { toast } from '../ui/use-toast'

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
  const [status, setStatus] = useState<'running' | 'paused' | 'stopped'>(
    initialStatus,
  )
  const statusRef = useRef(initialStatus)
  const [activeSteps, setActiveSteps] = useState<Record<string, string>>({}) // swimlaneId -> stepId
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({}) // stepId -> progress (0-100)
  const [timers, setTimers] = useState<Record<string, NodeJS.Timeout>>({})
  const [remainingTimeInSeconds, setRemainingTimeInSeconds] = useState<
    Record<string, number>
  >({})

  // Initialize active steps
  useEffect(() => {
    const initialActiveSteps: Record<string, string> = {}
    const initialStepProgress: Record<string, number> = {}
    const initialRemainingTime: Record<string, number> = {}

    routine.swimLanes?.forEach((swimlane) => {
      // Set the first step of each swimlane as active
      if (swimlane.steps && swimlane.steps.length > 0) {
        initialActiveSteps[swimlane.id] = swimlane.steps[0].id
        initialStepProgress[swimlane.steps[0].id] = 0
        initialRemainingTime[swimlane.steps[0].id] =
          swimlane.steps[0].durationInSeconds
      }
    })

    setActiveSteps(initialActiveSteps)
    setStepProgress(initialStepProgress)
    setRemainingTimeInSeconds(initialRemainingTime)
  }, [routine])

  // Status change handler
  useEffect(() => {
    statusRef.current = status
    if (onStatusChange) {
      onStatusChange(status)
    }

    if (status === 'running') {
      startTimers()
    } else if (status === 'paused') {
      pauseTimers()
    }
  }, [status])

  // Timer control functions
  const startTimers = () => {
    // Clear any existing timers
    Object.values(timers).forEach((timer) => clearTimeout(timer))

    const newTimers: Record<string, NodeJS.Timeout> = {}

    routine.swimLanes?.forEach((swimlane) => {
      const activeStepId = activeSteps[swimlane.id]
      if (!activeStepId) return

      const currentStep = swimlane.steps.find(
        (step) => step.id === activeStepId,
      )
      if (!currentStep) return

      // Start timer for this step
      newTimers[currentStep.id] = startStepTimer(currentStep)
    })

    setTimers(newTimers)
  }

  const pauseTimers = () => {
    // Stop all running timers
    Object.values(timers).forEach((timer) => clearTimeout(timer))
    setTimers({})
  }

  const startStepTimer = (step: RoutineStep): NodeJS.Timeout => {
    const stepDuration = step.durationInSeconds
    const updateInterval = 100 // ms
    const progressIncrement = (updateInterval / 1000 / stepDuration) * 100

    return setInterval(() => {
      if (statusRef.current !== 'running') return

      setStepProgress((prev) => {
        const currentProgress = prev[step.id] || 0
        const newProgress = Math.min(100, currentProgress + progressIncrement)

        // Update remaining time
        setRemainingTimeInSeconds((prevTime) => {
          const remaining = Math.max(0, stepDuration * (1 - newProgress / 100))
          return { ...prevTime, [step.id]: remaining }
        })

        // Check if step is complete
        if (newProgress >= 100) {
          clearInterval(timers[step.id])
          moveToNextStep(step)
        }

        return { ...prev, [step.id]: newProgress }
      })
    }, updateInterval)
  }

  const moveToNextStep = (completedStep: RoutineStep) => {
    const swimlane = routine.swimLanes?.find(
      (sl) => sl.id === completedStep.swimLaneId,
    )
    if (!swimlane) return

    const currentIndex = swimlane.steps.findIndex(
      (s) => s.id === completedStep.id,
    )
    const nextIndex = currentIndex + 1

    // Check if there's another step
    if (nextIndex < swimlane.steps.length) {
      const nextStep = swimlane.steps[nextIndex]

      // Update active step
      setActiveSteps((prev) => ({ ...prev, [swimlane.id]: nextStep.id }))
      setStepProgress((prev) => ({ ...prev, [nextStep.id]: 0 }))
      setRemainingTimeInSeconds((prev) => ({
        ...prev,
        [nextStep.id]: nextStep.durationInSeconds,
      }))

      // If automatic start, start the timer immediately
      if (nextStep.startType === 'automatic') {
        // Add a small delay to make the transition visible
        setTimeout(() => {
          // Start timer for next step
          setTimers((prev) => ({
            ...prev,
            [nextStep.id]: startStepTimer(nextStep),
          }))
        }, 300)
      } else {
        // Manual start - show notification
        toast({
          title: 'Manual step ready',
          description: `"${nextStep.name}" in ${swimlane.name} is ready to start manually.`,
        })
      }
    } else {
      // Swimlane complete
      toast({
        title: 'Swimlane complete',
        description: `${swimlane.name} has completed all steps!`,
      })

      // Check if all swimlanes are complete
      const allComplete = routine.swimLanes?.every((sl) => {
        const activeStep = activeSteps[sl.id]
        if (!activeStep) return true // No steps

        const stepIndex = sl.steps.findIndex((s) => s.id === activeStep)
        return (
          stepIndex === sl.steps.length - 1 && stepProgress[activeStep] >= 100
        )
      })

      if (allComplete) {
        toast({
          title: 'Routine complete!',
          description: 'All swimlanes have completed their steps.',
        })
        setStatus('stopped')
      }
    }
  }

  const handleManualStart = (stepId: string) => {
    // Find the step
    let targetStep: RoutineStep | undefined
    let swimlaneId: string = ''

    routine.swimLanes?.forEach((swimlane) => {
      const step = swimlane.steps.find((s) => s.id === stepId)
      if (step) {
        targetStep = step
        swimlaneId = swimlane.id
      }
    })

    if (!targetStep) return

    // Start the timer for this step
    setTimers((prev) => ({
      ...prev,
      [stepId]: startStepTimer(targetStep!),
    }))
  }

  // Main control handlers
  const handlePlayPause = () => {
    if (status === 'running') {
      setStatus('paused')
    } else {
      setStatus('running')
    }
  }

  const handleStop = () => {
    pauseTimers()
    setStatus('stopped')
  }

  // Determine if step should be showing start button
  const shouldShowStartButton = (swimlaneId: string, stepId: string) => {
    const isActiveStep = activeSteps[swimlaneId] === stepId
    const step = routine.swimLanes
      ?.find((sl) => sl.id === swimlaneId)
      ?.steps.find((s) => s.id === stepId)
    return (
      isActiveStep && step?.startType === 'manual' && stepProgress[stepId] === 0
    )
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
      <div className="flex items-center justify-between">
        <H4>Running: {routine.name}</H4>

        {endTime && (
          <Muted>Estimated completion: {endTime.toLocaleTimeString()}</Muted>
        )}

        <div className="flex gap-2">
          <Button
            variant={status === 'running' ? 'outline' : 'default'}
            onClick={handlePlayPause}
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

          <Button variant="destructive" onClick={handleStop}>
            <StopCircleIcon className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>

      {routine.swimLanes?.map((swimlane) => (
        <div key={swimlane.id} className="mt-4">
          <H4>{swimlane.name}</H4>

          <ScrollArea className="mt-2 h-auto w-full">
            <div className="flex w-full gap-4 p-4">
              {swimlane.steps.map((step, index) => {
                const isActive = activeSteps[swimlane.id] === step.id
                const isCompleted = stepProgress[step.id] === 100
                const isPending =
                  swimlane.steps.findIndex(
                    (s) => s.id === activeSteps[swimlane.id],
                  ) < index
                const progress = stepProgress[step.id] || 0
                const remainingTime =
                  remainingTimeInSeconds[step.id] || step.durationInSeconds

                return (
                  <Card
                    key={step.id}
                    className={`min-w-[250px] transition-shadow ${
                      isActive
                        ? 'border-primary shadow-lg'
                        : isCompleted
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : isPending
                            ? 'opacity-60'
                            : ''
                    }`}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        {step.name}
                        {isCompleted && (
                          <span className="text-xs text-green-500">
                            Completed
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 p-3">
                      <Muted className="text-xs">
                        Duration:{' '}
                        {formatSecondsToHHMMSS(step.durationInSeconds)}
                      </Muted>

                      {isActive && progress > 0 && (
                        <>
                          <Progress value={progress} className="h-2" />
                          <Muted className="text-xs">
                            Remaining: {formatSecondsToHHMMSS(remainingTime)}
                          </Muted>
                        </>
                      )}

                      {shouldShowStartButton(swimlane.id, step.id) && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => handleManualStart(step.id)}
                        >
                          <PlayIcon className="mr-2 h-3 w-3" />
                          Start
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
