'use client'
import React, { useEffect, useId, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  RefreshCwIcon,
  Trash2Icon,
  GripVerticalIcon,
  SquareIcon,
} from 'lucide-react'
import { SortableHandle } from '../ui/sortable'
import { Progress } from '../ui/progress'
import { RoutineStep } from '@/models'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export type RoutineTimerComponentProps = {
  step: RoutineStep
  stepUpdated: (updatedStep: RoutineStep) => void
  removeStep: (id: string) => void
}

type RunningState = 'stopped' | 'running' | 'completed'

const MILLISECONDS = 1000

const RoutineTimerComponent = (props: RoutineTimerComponentProps) => {
  const fieldId = useId()
  const [step, setStep] = useState<RoutineStep>(props.step)
  const [minutes, setMinutes] = useState(
    Math.floor(props.step?.durationInSeconds / 60).toString(),
  )
  const [seconds, setSeconds] = useState(
    (props.step?.durationInSeconds % 60).toString(),
  )
  const [timerProgress, setTimerProgress] = useState(0)
  const [runningState, setRunningState] = useState<RunningState>('stopped')
  const runningStateRef = useRef(runningState)

  const calculateTotalDuration = () => {
    return Number(minutes) * 60 + Number(seconds)
  }

  const runTimer = () => {
    const totalDuration = calculateTotalDuration()
    if (totalDuration <= 0) return

    const step = totalDuration / 100
    setTimeout(() => {
      if (
        runningStateRef.current === 'stopped' ||
        runningStateRef.current === 'completed'
      ) {
        return
      }
      setTimerProgress((previousProgress) => {
        if (previousProgress >= 100) {
          handleCompleted()
          return 100
        }
        return previousProgress + 1
      })
      runTimer()
    }, step * MILLISECONDS)
  }

  const handleCompleted = () => {
    setRunningState('completed')
    runningStateRef.current = 'completed'
  }

  const handleStart = () => {
    const totalDuration = calculateTotalDuration()
    if (totalDuration <= 0) return

    const updatedStep = {
      ...step,
      durationInSeconds: totalDuration,
    }
    props.stepUpdated(updatedStep)
    setStep(updatedStep)
    setRunningState('running')
    runningStateRef.current = 'running'
    setTimerProgress(0)
    runTimer()
  }

  const handleStop = () => {
    setRunningState('stopped')
    runningStateRef.current = 'stopped'
  }

  const handleNameChange = (name: string) => {
    const updatedStep = { ...step, name }
    setStep(updatedStep)
    props.stepUpdated(updatedStep)
  }

  const handleDurationChange = () => {
    const totalDuration = calculateTotalDuration()
    const updatedStep = {
      ...step,
      durationInSeconds: totalDuration,
    }
    setStep(updatedStep)
    props.stepUpdated(updatedStep)
  }

  useEffect(() => {
    handleDurationChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes, seconds])

  const handleStartTypeChange = (startType: 'automatic' | 'manual') => {
    const updatedStep = { ...step, startType }
    setStep(updatedStep)
    props.stepUpdated(updatedStep)
  }

  return (
    <Card className="min-w-[250px] group-data-[tokei-dragging]/step:border-primary">
      <CardHeader className="p-3">
        <CardTitle
          className="flex items-center justify-between text-sm"
          aria-label={step.name.trim() || 'Step'}
        >
          <SortableHandle
            aria-label={`Reorder ${step.name.trim() || 'step'}`}
            className="mr-2 p-1"
          >
            <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
          </SortableHandle>
          <Input
            value={step.name}
            onValueChange={(value) => handleNameChange(value)}
            className="h-7 text-sm"
            placeholder="Step name"
          />
          <Button
            size="icon"
            variant="outline"
            className="ml-2 w-14 hover:bg-destructive"
            onClick={() => props.removeStep(step.id)}
          >
            <Trash2Icon />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="mb-2 flex gap-2">
          <div className="flex-1">
            <Label htmlFor={`${fieldId}-minutes-input`} className="text-xs">
              Min
            </Label>
            <Input
              id={`${fieldId}-minutes-input`}
              type="number"
              inputMode="numeric"
              value={minutes}
              onValueChange={(value) => {
                setMinutes(Number(value).toString())
              }}
              onWheel={(e) => e.currentTarget.blur()} // Prevent scroll from changing value
              className="h-7 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`${fieldId}-seconds-input`} className="text-xs">
              Sec
            </Label>
            <Input
              id={`${fieldId}-seconds-input`}
              type="number"
              inputMode="numeric"
              value={seconds}
              onValueChange={(value) => {
                setSeconds(Number(value).toString())
              }}
              onWheel={(e) => e.currentTarget.blur()} // Prevent scroll from changing value
              className="h-7 text-sm"
            />
          </div>
        </div>

        <div className="mb-2">
          <Label htmlFor={`${fieldId}-start-type`} className="text-xs">
            Start
          </Label>
          <Select
            value={step.startType}
            onValueChange={(value: 'automatic' | 'manual') =>
              handleStartTypeChange(value)
            }
          >
            <SelectTrigger id={`${fieldId}-start-type`} className="h-7 text-sm">
              <SelectValue placeholder="Start type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">Automatically</SelectItem>
              <SelectItem value="manual">Manually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {runningState === 'running' && (
          <Progress
            value={timerProgress}
            aria-label={`${step.name} progress`}
            className="h-2"
          />
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0">
        {runningState === 'running' && (
          <Button
            onClick={handleStop}
            variant="outline"
            size="sm"
            className="h-7 w-full text-xs"
          >
            <SquareIcon className="mr-1 h-3 w-3" />
            Stop
          </Button>
        )}

        {runningState === 'completed' && (
          <Button
            onClick={handleStart}
            variant="outline"
            size="sm"
            className="h-7 w-full text-xs"
          >
            <RefreshCwIcon className="mr-1 h-3 w-3" />
            Restart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default RoutineTimerComponent
