'use client'
import React, { useState, useRef, useEffect } from 'react'
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
  PlayIcon,
  RefreshCwIcon,
  TrashIcon,
  GripVerticalIcon,
} from 'lucide-react'
import { Progress } from '../ui/progress'
import { StopIcon } from '@radix-ui/react-icons'
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
  isDragging?: boolean
  dragHandleProps?: any
}

type RunningState = 'stopped' | 'running' | 'completed'

const MILLISECONDS = 1000

const RoutineTimerComponent = (props: RoutineTimerComponentProps) => {
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
    <Card
      className={`min-w-[250px] ${props.isDragging ? 'border-primary' : ''}`}
    >
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-sm">
          {props.dragHandleProps && (
            <div {...props.dragHandleProps} className="mr-2 cursor-grab p-1">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <Input
            value={step.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-7 text-sm"
            placeholder="Step name"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => props.removeStep(step.id)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="mb-2 flex gap-2">
          <div className="flex-1">
            <Label htmlFor="minutes-input" className="text-xs">
              Min
            </Label>
            <Input
              id="minutes-input"
              type="number"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => {
                setMinutes(Number(e.target.value).toString())
              }}
              className="h-7 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="seconds-input" className="text-xs">
              Sec
            </Label>
            <Input
              id="seconds-input"
              type="number"
              inputMode="numeric"
              value={seconds}
              onChange={(e) => {
                setSeconds(Number(e.target.value).toString())
              }}
              className="h-7 text-sm"
            />
          </div>
        </div>

        <div className="mb-2">
          <Label htmlFor="start-type" className="text-xs">
            Start
          </Label>
          <Select
            value={step.startType}
            onValueChange={(value: 'automatic' | 'manual') =>
              handleStartTypeChange(value)
            }
          >
            <SelectTrigger id="start-type" className="h-7 text-sm">
              <SelectValue placeholder="Start type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">Automatic</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {runningState === 'running' && (
          <Progress value={timerProgress} className="h-2" />
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
            <StopIcon className="mr-1 h-3 w-3" />
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
