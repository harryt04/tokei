import { Routine } from '@/models'
import React from 'react'

export type ViewRoutineProps = {
  routine: Routine
}

export default function ViewRoutine(props: ViewRoutineProps) {
  const { routine } = props
  return (
    <>
      <p className="p-8 text-5xl">ViewRoutine component</p>
      <p>{routine._id}</p>
      <p>{routine.name}</p>
      <p>owner: {routine.userId}</p>
    </>
  )
}
