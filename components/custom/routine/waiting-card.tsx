import React from 'react'
import { TimerIcon, SkipForwardIcon, AlertCircleIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Muted } from '../../ui/typography'
import { Progress } from '../../ui/progress'
import { Button } from '../../ui/button'
import { formatSecondsToHHMMSS } from '@/lib/utils'

interface WaitingCardProps {
  waitTime: number
  totalWaitTime: number
  isBlockedByPrepTask?: boolean
  onSkip?: () => void
}

export default function WaitingCard({
  waitTime,
  totalWaitTime,
  isBlockedByPrepTask = false,
  onSkip,
}: WaitingCardProps) {
  // If blocked by prep task, show blocked message
  if (isBlockedByPrepTask) {
    return (
      <Card className="min-w-[250px] border-amber-400 bg-amber-50 dark:bg-amber-900/20">
        <CardHeader className="p-3">
          <CardTitle className="flex items-center justify-between text-sm">
            Blocked
            <AlertCircleIcon className="h-4 w-4 text-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <Muted className="text-xs">
            This swimlane is blocked by one or more incomplete prep tasks.
          </Muted>
          <br />
          <Muted className="text-xs text-amber-600 dark:text-amber-400">
            Complete the prep tasks above to start.
          </Muted>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-w-[250px] border-amber-400 bg-amber-50 dark:bg-amber-900/20">
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-sm">
          Waiting
          <TimerIcon className="h-4 w-4 text-amber-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <Muted className="text-xs">This swimlane will start in:</Muted>
        <Progress
          value={(1 - waitTime / totalWaitTime) * 100}
          className="h-2"
        />
        <Muted className="text-center text-sm font-semibold">
          {formatSecondsToHHMMSS(Math.round(waitTime))}
        </Muted>
        {onSkip && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={onSkip}
          >
            <SkipForwardIcon className="mr-2 h-3 w-3" />
            Start Now
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
