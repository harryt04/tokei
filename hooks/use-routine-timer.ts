'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Routine, RoutineStep, RoutineSwimLane } from '@/models'
import { calculateSwimLaneRunTimes } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

export type RoutineStatus = 'running' | 'paused' | 'stopped'

export type SwimlaneStatus = {
  currentStepIndex: number
  waitTimeInSeconds: number
  isWaiting: boolean
}

export type UseRoutineTimerOptions = {
  routine: Routine
  initialStatus: 'running' | 'paused'
  endTime?: Date
  onStatusChange?: (status: RoutineStatus) => void
}

export type UseRoutineTimerReturn = {
  status: RoutineStatus
  swimlanesStatus: Record<string, SwimlaneStatus>
  stepProgress: Record<string, number>
  remainingTimeInSeconds: Record<string, number>
  waitTimeRemaining: Record<string, number>
  handlePlayPause: () => void
  handleStop: () => void
  handleManualStart: (stepId: string) => void
  shouldShowStartButton: (step: RoutineStep) => boolean
}

/**
 * Custom hook to manage routine timer state and logic.
 * Handles swimlane wait times, step progress, and timer coordination.
 */
export function useRoutineTimer({
  routine,
  initialStatus,
  endTime,
  onStatusChange,
}: UseRoutineTimerOptions): UseRoutineTimerReturn {
  // Status state
  const [status, setStatus] = useState<RoutineStatus>(initialStatus)
  const statusRef = useRef<RoutineStatus>(initialStatus)

  // Swimlane status state
  const [swimlanesStatus, setSwimlanesStatus] = useState<
    Record<string, SwimlaneStatus>
  >({})
  const swimlanesStatusRef = useRef<Record<string, SwimlaneStatus>>({})

  // Step progress state (stepId -> progress 0-100)
  const [stepProgress, setStepProgress] = useState<Record<string, number>>({})
  const stepProgressRef = useRef<Record<string, number>>({})

  // Remaining time for active steps (stepId -> seconds remaining)
  const [remainingTimeInSeconds, setRemainingTimeInSeconds] = useState<
    Record<string, number>
  >({})

  // Wait time remaining for swimlanes (swimlaneId -> seconds remaining)
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<
    Record<string, number>
  >({})
  const waitTimeRemainingRef = useRef<Record<string, number>>({})

  // Timer refs to avoid stale closure issues
  const stepTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  const waitTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Keep refs in sync with state
  useEffect(() => {
    swimlanesStatusRef.current = swimlanesStatus
  }, [swimlanesStatus])

  useEffect(() => {
    stepProgressRef.current = stepProgress
  }, [stepProgress])

  useEffect(() => {
    waitTimeRemainingRef.current = waitTimeRemaining
  }, [waitTimeRemaining])

  // Initialize swimlanes and calculate wait times
  useEffect(() => {
    if (!routine.swimLanes || routine.swimLanes.length === 0) return

    const initialState = calculateInitialSwimlaneState(
      routine.swimLanes,
      endTime,
    )

    setSwimlanesStatus(initialState.swimlanesStatus)
    swimlanesStatusRef.current = initialState.swimlanesStatus
    setStepProgress(initialState.stepProgress)
    stepProgressRef.current = initialState.stepProgress
    setRemainingTimeInSeconds(initialState.remainingTime)
    setWaitTimeRemaining(initialState.waitTimeRemaining)
    waitTimeRemainingRef.current = initialState.waitTimeRemaining
  }, [routine, endTime])

  // Status change handler
  useEffect(() => {
    statusRef.current = status
    onStatusChange?.(status)

    if (status === 'running') {
      startAllTimers()
    } else if (status === 'paused') {
      pauseAllTimers()
    }
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pauseAllTimers()
    }
  }, [])

  /**
   * Calculate initial state for all swimlanes based on routine and optional end time.
   */
  const calculateInitialSwimlaneState = (
    swimLanes: RoutineSwimLane[],
    targetEndTime?: Date,
  ) => {
    const swimlaneTimes = calculateSwimLaneRunTimes(swimLanes)
    const longestDuration = Math.max(...Object.values(swimlaneTimes))

    // Calculate time until end (for timed mode)
    const now = new Date()
    const timeUntilEndInSeconds = targetEndTime
      ? Math.max(0, (targetEndTime.getTime() - now.getTime()) / 1000)
      : longestDuration

    const swimlanesStatus: Record<string, SwimlaneStatus> = {}
    const stepProgress: Record<string, number> = {}
    const waitTimeRemaining: Record<string, number> = {}
    const remainingTime: Record<string, number> = {}

    swimLanes.forEach((swimlane) => {
      const totalDuration = swimlaneTimes[swimlane.id] || 0

      // Calculate wait time based on mode
      const waitTime = targetEndTime
        ? Math.max(0, timeUntilEndInSeconds - totalDuration)
        : Math.max(0, longestDuration - totalDuration)
      const isWaiting = waitTime > 0

      swimlanesStatus[swimlane.id] = {
        currentStepIndex: 0,
        waitTimeInSeconds: waitTime,
        isWaiting,
      }

      if (isWaiting) {
        waitTimeRemaining[swimlane.id] = waitTime
      } else if (swimlane.steps.length > 0) {
        stepProgress[swimlane.steps[0].id] = 0
        remainingTime[swimlane.steps[0].id] =
          swimlane.steps[0].durationInSeconds
      }
    })

    return { swimlanesStatus, stepProgress, waitTimeRemaining, remainingTime }
  }

  /**
   * Start all active timers (wait timers and step timers).
   */
  const startAllTimers = () => {
    pauseAllTimers()

    routine.swimLanes?.forEach((swimlane) => {
      const currentStatus = swimlanesStatusRef.current[swimlane.id]

      if (currentStatus?.isWaiting) {
        startWaitTimer(swimlane)
      } else {
        const currentStepIndex = currentStatus?.currentStepIndex || 0
        if (currentStepIndex < swimlane.steps.length) {
          const currentStep = swimlane.steps[currentStepIndex]
          const progress = stepProgressRef.current[currentStep.id] || 0

          if (currentStep.startType === 'automatic' || progress > 0) {
            startStepTimer(currentStep)
          }
        }
      }
    })
  }

  /**
   * Pause all active timers.
   */
  const pauseAllTimers = () => {
    Object.values(stepTimersRef.current).forEach(clearInterval)
    Object.values(waitTimersRef.current).forEach(clearInterval)
    stepTimersRef.current = {}
    waitTimersRef.current = {}
  }

  /**
   * Start the wait timer for a swimlane.
   */
  const startWaitTimer = (swimlane: RoutineSwimLane) => {
    const waitTime = waitTimeRemainingRef.current[swimlane.id] || 0
    if (waitTime <= 0) return

    const updateInterval = 1000

    const timerId = setInterval(() => {
      if (statusRef.current !== 'running') return

      setWaitTimeRemaining((prev) => {
        const remaining = Math.max(0, (prev[swimlane.id] || 0) - 1)
        waitTimeRemainingRef.current = { ...prev, [swimlane.id]: remaining }

        if (remaining <= 0) {
          clearInterval(timerId)
          delete waitTimersRef.current[swimlane.id]
          onWaitComplete(swimlane)
        }

        return { ...prev, [swimlane.id]: remaining }
      })
    }, updateInterval)

    waitTimersRef.current[swimlane.id] = timerId
  }

  /**
   * Handle when a swimlane's wait period completes.
   */
  const onWaitComplete = (swimlane: RoutineSwimLane) => {
    // Mark swimlane as no longer waiting
    setSwimlanesStatus((prev) => {
      const newStatus = {
        ...prev,
        [swimlane.id]: { ...prev[swimlane.id], isWaiting: false },
      }
      swimlanesStatusRef.current = newStatus
      return newStatus
    })

    // Start the first step
    if (swimlane.steps.length > 0) {
      const firstStep = swimlane.steps[0]

      setStepProgress((prev) => {
        const newProgress = { ...prev, [firstStep.id]: 0 }
        stepProgressRef.current = newProgress
        return newProgress
      })

      setRemainingTimeInSeconds((prev) => ({
        ...prev,
        [firstStep.id]: firstStep.durationInSeconds,
      }))

      if (firstStep.startType === 'automatic') {
        startStepTimer(firstStep)
      } else {
        toast({
          title: 'Manual step ready',
          description: `"${firstStep.name}" in ${swimlane.name} is ready to start manually.`,
        })
      }
    }
  }

  /**
   * Start the timer for a step.
   */
  const startStepTimer = (step: RoutineStep) => {
    const stepDuration = step.durationInSeconds
    const updateInterval = 100
    const progressIncrement = (updateInterval / 1000 / stepDuration) * 100

    const timerId = setInterval(() => {
      if (statusRef.current !== 'running') return

      setStepProgress((prev) => {
        const currentProgress = prev[step.id] || 0
        const newProgress = Math.min(100, currentProgress + progressIncrement)
        stepProgressRef.current = { ...prev, [step.id]: newProgress }

        // Update remaining time
        setRemainingTimeInSeconds((prevTime) => ({
          ...prevTime,
          [step.id]: Math.max(0, stepDuration * (1 - newProgress / 100)),
        }))

        // Check if step is complete
        if (newProgress >= 100) {
          clearInterval(timerId)
          delete stepTimersRef.current[step.id]
          onStepComplete(step)
        }

        return { ...prev, [step.id]: newProgress }
      })
    }, updateInterval)

    stepTimersRef.current[step.id] = timerId
  }

  /**
   * Handle when a step completes.
   */
  const onStepComplete = (completedStep: RoutineStep) => {
    const swimlane = routine.swimLanes?.find(
      (sl) => sl.id === completedStep.swimLaneId,
    )
    if (!swimlane) return

    const currentStatus = swimlanesStatusRef.current[completedStep.swimLaneId]
    if (!currentStatus) return

    const nextStepIndex = currentStatus.currentStepIndex + 1

    // Update swimlane status
    setSwimlanesStatus((prev) => {
      const newStatus = {
        ...prev,
        [completedStep.swimLaneId]: {
          ...prev[completedStep.swimLaneId],
          currentStepIndex: nextStepIndex,
        },
      }
      swimlanesStatusRef.current = newStatus
      return newStatus
    })

    if (nextStepIndex < swimlane.steps.length) {
      // Start next step
      const nextStep = swimlane.steps[nextStepIndex]

      setStepProgress((prev) => {
        const newProgress = { ...prev, [nextStep.id]: 0 }
        stepProgressRef.current = newProgress
        return newProgress
      })

      setRemainingTimeInSeconds((prev) => ({
        ...prev,
        [nextStep.id]: nextStep.durationInSeconds,
      }))

      if (nextStep.startType === 'automatic') {
        setTimeout(() => startStepTimer(nextStep), 300)
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
        if (sl.id === completedStep.swimLaneId) {
          return nextStepIndex >= sl.steps.length
        }
        const slStatus = swimlanesStatusRef.current[sl.id]
        return (
          slStatus &&
          !slStatus.isWaiting &&
          slStatus.currentStepIndex >= sl.steps.length
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

  // Public control handlers
  const handlePlayPause = useCallback(() => {
    setStatus((current) => (current === 'running' ? 'paused' : 'running'))
  }, [])

  const handleStop = useCallback(() => {
    pauseAllTimers()
    setStatus('stopped')
  }, [])

  const handleManualStart = useCallback(
    (stepId: string) => {
      let targetStep: RoutineStep | undefined

      for (const swimlane of routine.swimLanes || []) {
        const step = swimlane.steps.find((s) => s.id === stepId)
        if (step) {
          targetStep = step
          break
        }
      }

      if (targetStep) {
        startStepTimer(targetStep)
      }
    },
    [routine],
  )

  const shouldShowStartButton = useCallback(
    (step: RoutineStep): boolean => {
      const swimlaneStatus = swimlanesStatus[step.swimLaneId]
      if (!swimlaneStatus) return false

      const swimlane = routine.swimLanes?.find(
        (sl) => sl.id === step.swimLaneId,
      )
      if (!swimlane) return false

      const isCurrentStep =
        swimlane.steps[swimlaneStatus.currentStepIndex]?.id === step.id

      return (
        isCurrentStep &&
        step.startType === 'manual' &&
        (stepProgress[step.id] || 0) === 0
      )
    },
    [swimlanesStatus, stepProgress, routine],
  )

  return {
    status,
    swimlanesStatus,
    stepProgress,
    remainingTimeInSeconds,
    waitTimeRemaining,
    handlePlayPause,
    handleStop,
    handleManualStart,
    shouldShowStartButton,
  }
}
