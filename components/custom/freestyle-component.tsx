import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'

export type FreestyleComponentProps = {}

function FreestyleComponent() {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Timer 1</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="duration">Duration</Label>
          <Input id="duration" placeholder="0" />
        </CardContent>
      </Card>
    </div>
  )
}

export default FreestyleComponent
