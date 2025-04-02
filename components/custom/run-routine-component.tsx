'use client'
import { Routine, RoutineStep } from '@/models'
import React, { useState, useEffect, useRef } from 'react'
import { H4, Muted } from '../ui/typography'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { BanIcon, PauseIcon, PlayIcon, TimerIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { calculateSwimLaneRunTimes, formatSecondsToHHMMSS } from '@/lib/utils'
import { toast } from '../ui/use-toast'

export type RunRoutineComponentProps = {
  routine: Routine
  initialStatus: 'running' | 'paused'
  endTime?: Date
  onStatusChange?: (status: 'running' | 'paused' | 'stopped') => void
}

type SwimlaneStatus = {
  currentStepIndex: number
  waitTimeInSeconds: number
  isWaiting: boolean
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
  const [swimlanesStatus, setSwimlanesStatus] = useState<
    Record<string, SwimlaneStatus>
  >({})
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({}) // stepId -> progress (0-100)
  const [timers, setTimers] = useState<Record<string, NodeJS.Timeout>>({})
  const [remainingTimeInSeconds, setRemainingTimeInSeconds] = useState<
    Record<string, number>
  >({})
  const [waitTimers, setWaitTimers] = useState<Record<string, NodeJS.Timeout>>(
    {},
  )
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<
    Record<string, number>
  >({})

  // Initialize swimlanes and calculate wait times
  useEffect(() => {
    if (!routine.swimLanes || routine.swimLanes.length === 0) return

    // Calculate total duration for each swimlane
    const swimlaneTimes = calculateSwimLaneRunTimes(routine.swimLanes)
    const longestDuration = Math.max(...Object.values(swimlaneTimes))

    // Initialize swimlane statuses with wait times
    const initialSwimlaneStatus: Record<string, SwimlaneStatus> = {}
    const initialStepProgress: Record<string, number> = {}
    const initialWaitTimeRemaining: Record<string, number> = {}
    const initialRemainingTime: Record<string, number> = {}

    routine.swimLanes.forEach((swimlane) => {
      const totalDuration = swimlaneTimes[swimlane.id] || 0
      const waitTime = Math.max(0, longestDuration - totalDuration)
      const isWaiting = waitTime > 0

      initialSwimlaneStatus[swimlane.id] = {
        currentStepIndex: 0,
        waitTimeInSeconds: waitTime,
        isWaiting,
      }

      if (isWaiting) {
        // If waiting, we track the wait time remaining
        initialWaitTimeRemaining[swimlane.id] = waitTime
      } else if (swimlane.steps.length > 0) {
        // Otherwise set up the first step
        initialStepProgress[swimlane.steps[0].id] = 0
        initialRemainingTime[swimlane.steps[0].id] =
          swimlane.steps[0].durationInSeconds
      }
    })

    setSwimlanesStatus(initialSwimlaneStatus)
    setStepProgress(initialStepProgress)
    setRemainingTimeInSeconds(initialRemainingTime)
    setWaitTimeRemaining(initialWaitTimeRemaining)
  }, [routine])

  // Status change handler
  useEffect(() => {
    statusRef.current = status
    if (onStatusChange) {
      onStatusChange(status)
    }

    if (status === 'running') {
      // Start wait timers and step timers
      startAllTimers()
    } else if (status === 'paused') {
      pauseAllTimers()
    }
  }, [status])

  // Start all timers (both wait timers and step timers)
  const startAllTimers = () => {
    pauseAllTimers() // Clear existing timers

    const newStepTimers: Record<string, NodeJS.Timeout> = {}
    const newWaitTimers: Record<string, NodeJS.Timeout> = {}

    // Start timers for swimlanes that are waiting
    routine.swimLanes?.forEach((swimlane) => {
      if (swimlanesStatus[swimlane.id]?.isWaiting) {
        newWaitTimers[swimlane.id] = startWaitTimer(swimlane.id)
      }
      // Start timers for steps in swimlanes that are not waiting
      else {
        const currentStepIndex =
          swimlanesStatus[swimlane.id]?.currentStepIndex || 0
        if (currentStepIndex < swimlane.steps.length) {
          const currentStep = swimlane.steps[currentStepIndex]
          // Only auto start if automatic or has progress
          const progress = stepProgress[currentStep.id] || 0
          if (currentStep.startType === 'automatic' || progress > 0) {
            newStepTimers[currentStep.id] = startStepTimer(currentStep)
          }
        }
      }
    })

    setTimers(newStepTimers)
    setWaitTimers(newWaitTimers)
  }

  // Pause all timers
  const pauseAllTimers = () => {
    Object.values(timers).forEach((timer) => clearInterval(timer))
    Object.values(waitTimers).forEach((timer) => clearInterval(timer))
    setTimers({})
    setWaitTimers({})
  }

  // Timer for swimlane wait periods
  const startWaitTimer = (swimlaneId: string): NodeJS.Timeout => {
    const waitTime = waitTimeRemaining[swimlaneId] || 0
    if (waitTime <= 0) return setTimeout(() => {}, 0) // Empty timer if no wait needed

    const updateInterval = 1000 // Update every second for wait timers
    const swimlane = routine.swimLanes?.find((sl) => sl.id === swimlaneId)
    if (!swimlane) return setTimeout(() => {}, 0)

    return setInterval(() => {
      if (statusRef.current !== 'running') return

      setWaitTimeRemaining((prev) => {
        const remaining = Math.max(
          0,
          (prev[swimlaneId] || 0) - updateInterval / 1000,
        )

        // Check if wait time completed
        if (remaining <= 0) {
          clearInterval(waitTimers[swimlaneId])

          // Mark swimlane as no longer waiting and start its first step
          setSwimlanesStatus((prev) => ({
            ...prev,
            [swimlaneId]: {
              ...prev[swimlaneId],
              isWaiting: false,
            },
          }))

          // Start the first step if automatic
          if (swimlane.steps.length > 0) {
            const firstStep = swimlane.steps[0]
            setStepProgress((prev) => ({ ...prev, [firstStep.id]: 0 }))
            setRemainingTimeInSeconds((prev) => ({
              ...prev,
              [firstStep.id]: firstStep.durationInSeconds,
            }))

            if (firstStep.startType === 'automatic') {
              setTimers((prev) => ({
                ...prev,
                [firstStep.id]: startStepTimer(firstStep),
              }))
            } else {
              // Notify that manual step is ready
              toast({
                title: 'Manual step ready',
                description: `"${firstStep.name}" in ${swimlane.name} is ready to start manually.`,
              })
            }
          }
        }

        return { ...prev, [swimlaneId]: remaining }
      })
    }, updateInterval)
  }

  // Timer for steps
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

  // Move to the next step in a swimlane
  const moveToNextStep = (completedStep: RoutineStep) => {
    const swimlane = routine.swimLanes?.find(
      (sl) => sl.id === completedStep.swimLaneId,
    )
    if (!swimlane) return

    const swimlaneStatus = swimlanesStatus[completedStep.swimLaneId]
    if (!swimlaneStatus) return

    const nextStepIndex = swimlaneStatus.currentStepIndex + 1

    // Update the swimlane status
    setSwimlanesStatus((prev) => ({
      ...prev,
      [completedStep.swimLaneId]: {
        ...prev[completedStep.swimLaneId],
        currentStepIndex: nextStepIndex,
      },
    }))

    // Check if there's another step in this swimlane
    if (nextStepIndex < swimlane.steps.length) {
      const nextStep = swimlane.steps[nextStepIndex]

      // Initialize the next step
      setStepProgress((prev) => ({ ...prev, [nextStep.id]: 0 }))
      setRemainingTimeInSeconds((prev) => ({
        ...prev,
        [nextStep.id]: nextStep.durationInSeconds,
      }))

      // Start the next step if it's automatic
      if (nextStep.startType === 'automatic') {
        setTimeout(() => {
          setTimers((prev) => ({
            ...prev,
            [nextStep.id]: startStepTimer(nextStep),
          }))
        }, 300)
      } else {
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
        const status = swimlanesStatus[sl.id]
        if (!status) return false

        return !status.isWaiting && status.currentStepIndex >= sl.steps.length
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

  // Handle manual start for a step
  const handleManualStart = (stepId: string) => {
    // Find the step
    let targetStep: RoutineStep | undefined

    for (const swimlane of routine.swimLanes || []) {
      const step = swimlane.steps.find((s) => s.id === stepId)
      if (step) {
        targetStep = step
        break
      }
    }

    if (!targetStep) return

    // Start the timer for this step
    setTimers((prev) => ({
      ...prev,
      [stepId]: startStepTimer(targetStep!),
    }))
  }

  // Main control handlers
  const handlePlayPause = () => {
    setStatus(status === 'running' ? 'paused' : 'running')
  }

  const handleStop = () => {
    pauseAllTimers()
    setStatus('stopped')
  }

  // Helper to get the current active step for a swimlane
  const getCurrentStep = (swimlaneId: string) => {
    const swimlane = routine.swimLanes?.find((sl) => sl.id === swimlaneId)
    if (!swimlane) return null

    const status = swimlanesStatus[swimlaneId]
    if (!status || status.isWaiting) return null

    if (status.currentStepIndex < swimlane.steps.length) {
      return swimlane.steps[status.currentStepIndex]
    }

    return null
  }

  // Determine if a step should show the start button
  const shouldShowStartButton = (step: RoutineStep) => {
    const swimlaneStatus = swimlanesStatus[step.swimLaneId]
    if (!swimlaneStatus) return false

    const currentStepIndex = swimlaneStatus.currentStepIndex
    const swimlane = routine.swimLanes?.find((sl) => sl.id === step.swimLaneId)
    if (!swimlane) return false

    const isCurrentStep = swimlane.steps[currentStepIndex]?.id === step.id

    return (
      isCurrentStep &&
      step.startType === 'manual' &&
      (stepProgress[step.id] || 0) === 0
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
            <BanIcon className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>

      {routine.swimLanes?.map((swimlane) => {
        const swimlaneStatus = swimlanesStatus[swimlane.id]
        const isWaiting = swimlaneStatus?.isWaiting
        const waitTime = waitTimeRemaining[swimlane.id] || 0

        return (
          <div key={swimlane.id} className="mt-4">
            <H4>{swimlane.name}</H4>

            <ScrollArea className="mt-2 h-auto w-full">
              <div className="flex w-full gap-4 p-4">
                {isWaiting && (
                  <Card className="min-w-[250px] border-amber-400 bg-amber-50 dark:bg-amber-900/20">
                    <CardHeader className="p-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        Waiting
                        <TimerIcon className="h-4 w-4 text-amber-500" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3">
                      <Muted className="text-xs">
                        This swimlane will start in:
                      </Muted>
                      <Progress
                        value={
                          (1 - waitTime / swimlaneStatus.waitTimeInSeconds) *
                          100
                        }
                        className="h-2"
                      />
                      <Muted className="text-center text-sm font-semibold">
                        {formatSecondsToHHMMSS(Math.round(waitTime))}
                      </Muted>
                    </CardContent>
                  </Card>
                )}

                {/* Show all steps regardless of waiting status */}
                {swimlane.steps.map((step, index) => {
                  const currentStepIndex = swimlaneStatus?.currentStepIndex || 0
                  const isActive = !isWaiting && currentStepIndex === index
                  const isCompleted = !isWaiting && index < currentStepIndex
                  const isPending = isWaiting || index > currentStepIndex
                  const progress = isActive ? stepProgress[step.id] || 0 : 0
                  const remainingTime = isActive
                    ? remainingTimeInSeconds[step.id] || step.durationInSeconds
                    : 0

                  return (
                    <Card
                      key={step.id}
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
                          {isWaiting && index === 0 && (
                            <span className="text-xs text-amber-500">
                              Up first
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-xs text-green-500">
                              Completed
                            </span>
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
                            {step.startType === 'manual'
                              ? 'Manual start'
                              : 'Automatic'}
                          </Muted>
                        )}

                        {isActive && progress > 0 && (
                          <>
                            <Progress value={progress} className="h-2" />
                            <Muted className="text-xs">
                              Remaining:{' '}
                              {formatSecondsToHHMMSS(Math.round(remainingTime))}
                            </Muted>
                          </>
                        )}

                        {!isWaiting && shouldShowStartButton(step) && (
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
        )
      })}
    </div>
  )
}
