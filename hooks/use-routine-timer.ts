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
  pausedSteps: Set<string>
  handlePlayPause: () => void
  handleStop: () => void
  handleManualStart: (stepId: string) => void
  handleSkipStep: (stepId: string) => void
  handleSkipWait: (swimlaneId: string) => void
  handlePauseStep: (stepId: string) => void
  handleResumeStep: (stepId: string) => void
  handleRestartStep: (stepId: string) => void
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

  // Track which steps are individually paused
  const [pausedSteps, setPausedSteps] = useState<Set<string>>(new Set())
  const pausedStepsRef = useRef<Set<string>>(new Set())

  // Keep refs in sync with state
  useEffect(() => {
    pausedStepsRef.current = pausedSteps
  }, [pausedSteps])

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
      // Check if this specific step is paused
      if (pausedStepsRef.current.has(step.id)) return

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

    // Always recalculate wait times when a step completes - other swimlanes may start earlier
    recalculateWaitTimes()

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

  /**
   * Recalculate wait times for all waiting swimlanes based on current progress.
   * Called when a step completes or is skipped, to start waiting swimlanes earlier.
   */
  const recalculateWaitTimes = () => {
    if (!routine.swimLanes) return

    // Calculate remaining STEP time for each swimlane (excluding wait times)
    // This tells us how long each swimlane needs from when it starts/resumes
    const stepsRemainingTimes: Record<string, number> = {}

    routine.swimLanes.forEach((sl) => {
      const slStatus = swimlanesStatusRef.current[sl.id]
      if (!slStatus) return

      if (slStatus.currentStepIndex >= sl.steps.length) {
        // This swimlane is complete
        stepsRemainingTimes[sl.id] = 0
      } else if (slStatus.isWaiting) {
        // Still waiting - all steps remain
        const stepsRemaining = sl.steps.reduce(
          (sum, step) => sum + step.durationInSeconds,
          0,
        )
        stepsRemainingTimes[sl.id] = stepsRemaining
      } else {
        // In progress - calculate remaining time from current step onwards
        let remaining = 0
        for (let i = slStatus.currentStepIndex; i < sl.steps.length; i++) {
          const step = sl.steps[i]
          if (i === slStatus.currentStepIndex) {
            // Current step - use remaining time based on progress
            const progress = stepProgressRef.current[step.id] || 0
            remaining += step.durationInSeconds * (1 - progress / 100)
          } else {
            remaining += step.durationInSeconds
          }
        }
        stepsRemainingTimes[sl.id] = remaining
      }
    })

    // Find the longest remaining steps time (this is what everything needs to align to)
    const maxStepsRemaining = Math.max(...Object.values(stepsRemainingTimes))

    // Adjust wait times for waiting swimlanes
    routine.swimLanes.forEach((sl) => {
      const slStatus = swimlanesStatusRef.current[sl.id]
      if (!slStatus?.isWaiting) return

      const thisSwimlanesSteps = stepsRemainingTimes[sl.id] || 0
      const newWaitTime = Math.max(0, maxStepsRemaining - thisSwimlanesSteps)
      const currentWaitRemaining = waitTimeRemainingRef.current[sl.id] || 0

      // Only adjust if the new wait time is shorter
      if (newWaitTime < currentWaitRemaining) {
        if (newWaitTime <= 0) {
          // Should start now! Skip the wait
          if (waitTimersRef.current[sl.id]) {
            clearInterval(waitTimersRef.current[sl.id])
            delete waitTimersRef.current[sl.id]
          }

          setWaitTimeRemaining((prev) => {
            const updated = { ...prev, [sl.id]: 0 }
            waitTimeRemainingRef.current = updated
            return updated
          })

          onWaitComplete(sl)

          toast({
            title: 'Starting early',
            description: `"${sl.name}" can now start.`,
          })
        } else {
          // Reduce wait time
          setWaitTimeRemaining((prev) => {
            const updated = { ...prev, [sl.id]: newWaitTime }
            waitTimeRemainingRef.current = updated
            return updated
          })
        }
      }
    })
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

  /**
   * Skip the current step and move to the next one.
   * Useful when a step has already been completed before starting the routine.
   */
  const handleSkipStep = useCallback(
    (stepId: string) => {
      let targetStep: RoutineStep | undefined

      for (const swimlane of routine.swimLanes || []) {
        const step = swimlane.steps.find((s) => s.id === stepId)
        if (step) {
          targetStep = step
          break
        }
      }

      if (!targetStep) return

      // Clear any existing timer for this step
      if (stepTimersRef.current[stepId]) {
        clearInterval(stepTimersRef.current[stepId])
        delete stepTimersRef.current[stepId]
      }

      // Mark step as complete (100% progress)
      setStepProgress((prev) => {
        const newProgress = { ...prev, [stepId]: 100 }
        stepProgressRef.current = newProgress
        return newProgress
      })

      // Trigger the step complete logic
      onStepComplete(targetStep)

      toast({
        title: 'Step skipped',
        description: `"${targetStep.name}" marked as complete.`,
      })
    },
    [routine],
  )

  /**
   * Skip the waiting period for a swimlane and start its first step immediately.
   * Useful when you've already completed pre-routine work.
   */
  const handleSkipWait = useCallback(
    (swimlaneId: string) => {
      const swimlane = routine.swimLanes?.find((sl) => sl.id === swimlaneId)
      if (!swimlane) return

      const currentStatus = swimlanesStatusRef.current[swimlaneId]
      if (!currentStatus?.isWaiting) return

      // Clear the wait timer
      if (waitTimersRef.current[swimlaneId]) {
        clearInterval(waitTimersRef.current[swimlaneId])
        delete waitTimersRef.current[swimlaneId]
      }

      // Set wait time to 0
      setWaitTimeRemaining((prev) => {
        const updated = { ...prev, [swimlaneId]: 0 }
        waitTimeRemainingRef.current = updated
        return updated
      })

      // Trigger wait complete logic
      onWaitComplete(swimlane)

      toast({
        title: 'Wait skipped',
        description: `Starting "${swimlane.name}" now.`,
      })
    },
    [routine],
  )

  /**
   * Pause a specific step's timer without affecting other steps.
   */
  const handlePauseStep = useCallback((stepId: string) => {
    setPausedSteps((prev) => {
      const next = new Set(prev)
      next.add(stepId)
      pausedStepsRef.current = next
      return next
    })

    toast({
      title: 'Step paused',
      description: 'Timer paused for this step.',
    })
  }, [])

  /**
   * Resume a paused step's timer.
   */
  const handleResumeStep = useCallback((stepId: string) => {
    setPausedSteps((prev) => {
      const next = new Set(prev)
      next.delete(stepId)
      pausedStepsRef.current = next
      return next
    })

    toast({
      title: 'Step resumed',
      description: 'Timer resumed for this step.',
    })
  }, [])

  /**
   * Restart a step from the beginning.
   */
  const handleRestartStep = useCallback(
    (stepId: string) => {
      let targetStep: RoutineStep | undefined

      for (const swimlane of routine.swimLanes || []) {
        const step = swimlane.steps.find((s) => s.id === stepId)
        if (step) {
          targetStep = step
          break
        }
      }

      if (!targetStep) return

      // Clear any existing timer for this step
      if (stepTimersRef.current[stepId]) {
        clearInterval(stepTimersRef.current[stepId])
        delete stepTimersRef.current[stepId]
      }

      // Remove from paused steps if it was paused
      setPausedSteps((prev) => {
        const next = new Set(prev)
        next.delete(stepId)
        pausedStepsRef.current = next
        return next
      })

      // Reset progress to 0
      setStepProgress((prev) => {
        const newProgress = { ...prev, [stepId]: 0 }
        stepProgressRef.current = newProgress
        return newProgress
      })

      // Reset remaining time
      setRemainingTimeInSeconds((prev) => ({
        ...prev,
        [stepId]: targetStep!.durationInSeconds,
      }))

      // Start the timer again
      startStepTimer(targetStep)

      toast({
        title: 'Step restarted',
        description: `"${targetStep.name}" started over.`,
      })
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
    pausedSteps,
    handlePlayPause,
    handleStop,
    handleManualStart,
    handleSkipStep,
    handleSkipWait,
    handlePauseStep,
    handleResumeStep,
    handleRestartStep,
    shouldShowStartButton,
  }
}
