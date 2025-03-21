'use client'
import React, { useState, useRef } from 'react'
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
import { PlayIcon, TrashIcon } from 'lucide-react'
import { Timer } from './freestyle-list'
import { getDateNMinutesFromNow } from '@/lib/utils'
import { Progress } from '../ui/progress'
import { StopIcon } from '@radix-ui/react-icons'
import Countdown from 'react-countdown'

export type FreestyleComponentProps = {
  timer: Timer
  timerUpdated: (newTimer: Timer) => void
  removeTimer: (id: string) => void
}

type RunningState = 'stopped' | 'running' | 'completed'

const MINUTES = 60
const MILISECONDS = 1000

const FreestyleComponent = (props: FreestyleComponentProps) => {
  const [timer, setTimer] = useState<Timer>(props.timer)
  const [duration, setDuration] = useState(props.timer?.duration.toString())
  const [timerProgress, setTimerProgress] = useState(0)

  const [runningState, setRunningState] = useState<RunningState>('stopped')
  const runningStateRef = useRef(runningState)

  const runTimer = () => {
    const step = (Number(duration) * MINUTES) / 100
    setTimeout(() => {
      if (
        runningStateRef.current === 'stopped' ||
        runningStateRef.current === 'completed'
      ) {
        return
      }
      setTimerProgress((previousProgress) => {
        if (previousProgress === 100) {
          setRunningState('completed')
          runningStateRef.current = 'completed'
          return 0
        }
        return previousProgress + 1
      })
      runTimer()
    }, step * MILISECONDS)
  }

  const handleStart = () => {
    const now = new Date()
    const timerInput = {
      ...props.timer,
      startedAt: now,
      willEndAt: getDateNMinutesFromNow(Number(duration)),
    }
    props.timerUpdated(timerInput)
    setTimer(timerInput)
    setRunningState('running')
    runningStateRef.current = 'running'
    setTimerProgress(0)
    runTimer()
  }

  const handleStop = () => {
    setRunningState('stopped')
    runningStateRef.current = 'stopped'
  }

  const clockRenderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      return <span>{timer?.name} is finished!</span>
    } else {
      // Render a countdown
      return (
        <span>
          {hours && `${hours}`}
          {minutes && `${minutes}`}:{seconds} remaining
        </span>
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <input
            type="text"
            value={timer?.name ?? ''}
            onChange={(e) => {
              setTimer({
                ...timer,
                name: e.target.value,
              })
              props.timerUpdated({ ...props.timer, name: e.target.value })
            }}
            className="w-full border-none bg-transparent outline-none"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {runningState === 'running' && (
          <div className="pb-4">
            <Countdown
              date={timer?.willEndAt}
              renderer={clockRenderer}
            ></Countdown>
          </div>
        )}

        {runningState === 'completed' && (
          <>
            <div className="pb-4">{timer?.name} is finished!</div>
          </>
        )}

        {(runningState === 'stopped' || runningState === 'completed') && (
          <>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              placeholder="0"
              type="number"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value)
                props.timerUpdated({
                  ...props.timer,
                  duration: Number(e.target.value),
                })
              }}
            />
          </>
        )}

        {runningState === 'running' && (
          <>
            <Progress value={timerProgress}></Progress>
          </>
        )}
      </CardContent>

      <CardFooter>
        {(runningState === 'stopped' || runningState === 'completed') && (
          <>
            <Button onClick={handleStart}>
              <PlayIcon />
              {runningState === 'completed' ? 'Start again' : 'Start'}
            </Button>
          </>
        )}

        {runningState === 'running' && (
          <>
            <Button onClick={handleStop} variant="destructive">
              <StopIcon />
              Stop
            </Button>
          </>
        )}

        <Button
          onClick={handleStop}
          variant="destructive"
          className="ml-4"
          onClickCapture={() => {
            console.log('timer: ', timer)
            props.removeTimer(timer.id)
          }}
        >
          <TrashIcon />
          Remove
        </Button>
      </CardFooter>
    </Card>
  )
}

export default FreestyleComponent
