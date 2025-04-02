'use client'
import { Routine, RoutineStep } from '@/models'
import React, { useState, useEffect, useRef } from 'react'
import { H4, Muted } from '../ui/typography'
import { Button } from '../ui/button'
import { calculateSwimLaneRunTimes } from '@/lib/utils'
import { toast } from '../ui/use-toast'
import RoutineControls from './routine/RoutineControls'
import SwimlaneComponent from './routine/SwimlaneComponent'

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
  const statusRef = useRef<'running' | 'paused' | 'stopped'>(initialStatus)
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
