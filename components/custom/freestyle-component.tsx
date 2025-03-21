'use client'
import React, { useState } from 'react'
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
import { PlayIcon } from 'lucide-react'
import { Timer } from './freestyle-list'
import { getDateNMinutesFromNow } from '@/lib/utils'
import { Progress } from '../ui/progress'

export type FreestyleComponentProps = {
  timer: Timer
  timerUpdated: (newTimer: Timer) => void
}

type RunningState = 'stopped' | 'running'

const MINUTES = 60

function FreestyleComponent(props: FreestyleComponentProps) {
  const [timer, setTimer] = useState<Timer>(props.timer)
  const [duration, setDuration] = useState(props.timer?.duration.toString()) // Track duration input
  const [timerProgress, setTimerProgress] = useState(0) // Track duration input

  const [runningState, setRunningState] = useState<RunningState>('stopped')

  const runTimer = () => {
    console.log('runningState: ', runningState)
    const step = (Number(duration) * MINUTES) / 100
    console.log('step: ', step)
    setTimeout(() => {
      console.log('runningState: ', runningState)
      if (runningState === 'stopped') return
      setTimerProgress((previousProgress) => previousProgress + 1)
      runTimer()
    }, step)
  }

  const handleStart = () => {
    const now = new Date()
    props.timerUpdated({
      ...props.timer,
      startedAt: now,
      willEndAt: getDateNMinutesFromNow(Number(duration)),
    })
    setRunningState('running')
    setTimerProgress(0)
    runTimer()
  }

  return (
    <div className="p-4">
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
          {runningState === 'stopped' && (
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
          {runningState === 'stopped' && (
            <>
              <Button onClick={handleStart}>
                <PlayIcon />
                Start
              </Button>
            </>
          )}

          {runningState === 'running' && <></>}
        </CardFooter>
      </Card>
    </div>
  )
}

export default FreestyleComponent
