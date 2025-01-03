'use client'

import { Routine } from '@/models'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

export default function RoutinePage() {
  const { id } = useParams() // Access the [id] from the route
  return (
    <div>
      <h1>Routine ID: {id}</h1>
    </div>
  )
}
