'use server'
import RoutinesList from '@/components/custom/routines-list'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'
import { currentUser } from '@clerk/nextjs/server'
import { Routine } from '@/models'

export default async function Routines() {
  const user = await currentUser()

  let initialRoutines: Routine[] = []

  if (user) {
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const documents = await routinesCollection
      .find({ userId: user.id })
      .toArray()

    initialRoutines = documents.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    })) as Routine[]
  }

  return (
    <>
      <RoutinesList initialRoutines={initialRoutines} />
    </>
  )
}
