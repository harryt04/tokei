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
import { PlayIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'
import { Timer } from './freestyle-list'
import { getDateNMinutesFromNow, playCustomAlarm } from '@/lib/utils'
import { Progress } from '../ui/progress'
import { StopIcon } from '@radix-ui/react-icons'
import Countdown from 'react-countdown'
import '../styles/freestyle.css'

export type FreestyleComponentProps = {
  timer: Timer
  timerUpdated: (newTimer: Timer) => void
  removeTimer: (id: string) => void
}

type RunningState = 'stopped' | 'running' | 'completed'

const MILISECONDS = 1000

const FreestyleComponent = (props: FreestyleComponentProps) => {
  const [timer, setTimer] = useState<Timer>(props.timer)
  const [hours, setHours] = useState(
    Math.floor(props.timer?.duration / 3600).toString(),
  )
  const [minutes, setMinutes] = useState(
    Math.floor((props.timer?.duration % 3600) / 60).toString(),
  )
  const [seconds, setSeconds] = useState(
    (props.timer?.duration % 60).toString(),
  )
  const [timerProgress, setTimerProgress] = useState(0)
  const [runningState, setRunningState] = useState<RunningState>('stopped')
  const runningStateRef = useRef(runningState)
  const [alarm, setAlarm] = useState<Howl | null>(null)
  const calculateTotalDuration = () => {
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
  }

  const runTimer = () => {
    const step = calculateTotalDuration() / 100
    setTimeout(() => {
      if (
        runningStateRef.current === 'stopped' ||
        runningStateRef.current === 'completed'
      ) {
        return
      }
      setTimerProgress((previousProgress) => {
        if (previousProgress === 100) {
          handleCompleted()
          return 0
        }
        return previousProgress + 1
      })
      runTimer()
    }, step * MILISECONDS)
  }

  const handleCompleted = () => {
    const newAlarm = playCustomAlarm()
    setAlarm(newAlarm)
    setRunningState('completed')
    runningStateRef.current = 'completed'
  }

  const handleStopAlarm = () => {
    alarm?.stop()
    setAlarm(null)
  }

  const handleStart = () => {
    handleStopAlarm()
    const totalDuration = calculateTotalDuration()
    const now = new Date()
    const timerInput = {
      ...props.timer,
      duration: totalDuration,
      startedAt: now,
      willEndAt: getDateNMinutesFromNow(totalDuration / 60),
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
      const h = hours > 0 ? `${hours} hours, ` : ''
      const m = minutes > 0 ? `${minutes} minutes, ` : ''
      const s = seconds > 0 ? `${seconds} seconds ` : ''
      return <span>{`${h}${m}${s} remaining...`}</span>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="freestyle-header">
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
          {!alarm && runningState !== 'running' && (
            <>
              <Button
                variant="destructive"
                size="icon"
                onClickCapture={() => {
                  props.removeTimer(timer.id)
                }}
              >
                <Trash2Icon />
              </Button>
            </>
          )}
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

        {(runningState === 'stopped' || runningState === 'completed') &&
          !alarm && (
            <>
              <div className="flex gap-6">
                <div>
                  <Label htmlFor="hours-input">Hours</Label>
                  <Input
                    id="hours-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Hours"
                    value={hours}
                    onChange={(e) => {
                      setHours(Number(e.target.value).toString())
                      props.timerUpdated({
                        ...props.timer,
                        duration: calculateTotalDuration(),
                      })
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="min-input">Minutes</Label>
                  <Input
                    id="min-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Minutes"
                    value={minutes}
                    onChange={(e) => {
                      setMinutes(Number(e.target.value).toString())
                      props.timerUpdated({
                        ...props.timer,
                        duration: calculateTotalDuration(),
                      })
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="sec-input">Seconds</Label>
                  <Input
                    id="sec-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Seconds"
                    value={seconds}
                    onChange={(e) => {
                      setSeconds(Number(e.target.value).toString())
                      props.timerUpdated({
                        ...props.timer,
                        duration: calculateTotalDuration(),
                      })
                    }}
                  />
                </div>
              </div>
            </>
          )}

        {runningState === 'running' && (
          <>
            <Progress value={timerProgress}></Progress>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-6">
        {(runningState === 'stopped' || runningState === 'completed') &&
          !alarm && (
            <>
              <Button
                onClick={() => {
                  handleStart()
                }}
              >
                {runningState === 'completed' ? (
                  <RefreshCwIcon />
                ) : (
                  <PlayIcon />
                )}
                {runningState === 'completed' ? 'Restart' : 'Start'}
              </Button>
            </>
          )}

        {runningState === 'running' && (
          <>
            <Button onClick={handleStop} variant="secondary">
              <StopIcon />
              Stop
            </Button>
          </>
        )}

        {alarm && (
          <>
            <Button onClick={handleStopAlarm} variant="secondary">
              <StopIcon />
              Stop alarm
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

export default FreestyleComponent
