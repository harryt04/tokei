'use server'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'
import { currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { ObjectId } from 'mongodb'
import ViewRoutine from '@/components/custom/view-routine'
import { Routine } from '@/models'

export default async function RoutinePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const user = await currentUser()
  if (user) {
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const routineDocument = await routinesCollection.findOne({
      _id: new ObjectId(id),
    })
    if (!routineDocument) notFound()

    const routine = JSON.parse(JSON.stringify(routineDocument)) as Routine

    return (
      <>
        <ViewRoutine routine={routine}></ViewRoutine>
      </>
    )
  }
  return null
}
