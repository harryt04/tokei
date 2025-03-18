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

export type FreestyleComponentProps = {
  startingTitle?: string
}

function FreestyleComponent(props: FreestyleComponentProps) {
  const [title, setTitle] = useState(props.startingTitle ?? 'Timer 1')

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-none bg-transparent outline-none"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input id="duration" placeholder="0" />
        </CardContent>
        <CardFooter>
          <Button>
            <PlayIcon />
            Start
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default FreestyleComponent
