'use server'
import { getRoutine } from '@/actions/routine'
import { currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

export default async function RoutinePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const user = await currentUser()
  const response = await getRoutine(id, user as any)
  if (response.notFound) notFound()

  return (
    <div>
      <h1>Routine ID: {id}</h1>
    </div>
  )
}
