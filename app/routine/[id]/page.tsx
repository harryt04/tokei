import { getRoutine } from '@/actions/routine'
import { currentUser } from '@clerk/nextjs/server'

export default async function RoutinePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const user = await currentUser()
  const response = await getRoutine(id, user as any)
  console.log('response: ', response)
  console.log('id: ', id)
  return (
    <div>
      <h1>Routine ID: {id}</h1>
    </div>
  )
}
