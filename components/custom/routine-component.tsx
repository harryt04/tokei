'use client'

import { Routine } from '@/models'
import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Button } from '../ui/button'
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { RoutineForm } from './routine-form'
import { useRouter } from 'next/navigation'

export const RoutineComponent = ({
  routine,
  editMode,
  onDelete,
}: {
  routine: Routine
  editMode: boolean
  onDelete: (routine: Routine) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [updatedRoutine, setUpdatedRoutine] = useState<Routine>(routine)
  const router = useRouter()

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCloseEdit = () => {
    setIsEditing(false)
  }

  const handleSubmit = async (updatedRoutineData: Routine) => {
    setUpdatedRoutine(updatedRoutineData)
    setIsEditing(false)
    fetch(`/api/routine?id=${updatedRoutineData._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRoutineData),
    })
  }

  const handleDeleteClick = async () => {
    onDelete(updatedRoutine)
    fetch(`/api/routine?id=${updatedRoutine._id}`, {
      method: 'DELETE',
    })
  }

  return (
    <Card
      className="min-h-full cursor-pointer"
      onClick={() => router.push(`/routine/${updatedRoutine._id}`)}
    >
      <CardHeader>
        <CardTitle>{updatedRoutine.name}</CardTitle>
        <CardDescription>
          {updatedRoutine.steps?.length || 0} Steps,{' '}
          {updatedRoutine.swimLanes?.length || 0} Swimlanes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {editMode && !isEditing && (
          <div className="flex flex-row gap-4 p-4">
            <Button variant="outline" onClick={handleEditClick}>
              <Pencil1Icon /> Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              <TrashIcon /> Delete
            </Button>
          </div>
        )}
        {isEditing && (
          <RoutineForm
            onClose={handleCloseEdit}
            onSubmit={handleSubmit}
            routine={updatedRoutine}
          />
        )}
      </CardContent>
    </Card>
  )
}
