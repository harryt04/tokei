import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'
import { notFound } from 'next/navigation'
import { ObjectId } from 'mongodb'
import ViewRoutine from '@/components/custom/view-routine'
import { Routine } from '@/models'
import { addUser } from '@/lib/utils'

export default async function RoutinePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  addUser(session.user)

  try {
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const routineDocument = await routinesCollection.findOne({
      _id: new ObjectId(id),
    })
    if (!routineDocument) notFound()

    const routine = JSON.parse(JSON.stringify(routineDocument)) as Routine

    return <ViewRoutine routine={routine}></ViewRoutine>
  } catch (error) {
    notFound()
  }
}
