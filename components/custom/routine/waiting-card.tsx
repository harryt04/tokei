import React from 'react'
import { TimerIcon, SkipForwardIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Muted } from '../../ui/typography'
import { Progress } from '../../ui/progress'
import { Button } from '../../ui/button'
import { formatSecondsToHHMMSS } from '@/lib/utils'

interface WaitingCardProps {
  waitTime: number
  totalWaitTime: number
  onSkip?: () => void
}

export default function WaitingCard({
  waitTime,
  totalWaitTime,
  onSkip,
}: WaitingCardProps) {
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
