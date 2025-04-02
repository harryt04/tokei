import React from 'react'
import { TimerIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Muted } from '../../ui/typography'
import { Progress } from '../../ui/progress'
import { formatSecondsToHHMMSS } from '@/lib/utils'

interface WaitingCardProps {
  waitTime: number
  totalWaitTime: number
}

export default function WaitingCard({
  waitTime,
  totalWaitTime,
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
      </CardContent>
    </Card>
  )
}
