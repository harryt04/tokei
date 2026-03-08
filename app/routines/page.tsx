import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import RoutinesList from '@/components/custom/routines-list'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'
import { Routine } from '@/models'
import { addUser } from '@/lib/utils'

export default async function Routines() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  addUser(session.user)

  const client = await getMongoClient()
  const db = client.db(mongoDBConfig.dbName)
  const routinesCollection = db.collection(mongoDBConfig.collections.routines)

  const documents = await routinesCollection
    .find({ userId: session.user.id })
    .toArray()

  const initialRoutines = documents.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  })) as Routine[]

  return <RoutinesList initialRoutines={initialRoutines} />
}
