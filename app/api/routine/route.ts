import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'
import { ObjectId } from 'mongodb'
import { extractParamFromUrl } from '@/lib/utils'

// GET, PATCH, DELETE for a specific routine
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    const id = extractParamFromUrl(req, 'id')

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const routine = await routinesCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!routine || routine.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Routine not found or unauthorized' },
        { status: 404 },
      )
    }

    return NextResponse.json(routine, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    const id = extractParamFromUrl(req, 'id')

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const existingRoutine = id
      ? await routinesCollection.findOne({
          _id: new ObjectId(id),
        })
      : false

    const routineToUpsert = {
      ...body,
      userId: session.user.id,
      updatedAt: new Date(),
    }

    if (!existingRoutine) {
      const insertResult = await routinesCollection.insertOne(routineToUpsert)
      return NextResponse.json(
        {
          success: true,
          updatedCount: 1,
          updatedRoutine: { ...routineToUpsert, _id: insertResult.insertedId },
        },
        { status: 200 },
      )
    } else {
      delete routineToUpsert._id
      const result = await routinesCollection.updateOne(
        { _id: new ObjectId(id as string) },
        { $set: routineToUpsert },
      )

      return NextResponse.json(
        {
          success: true,
          updatedCount: result.modifiedCount,
          updatedRoutine: routineToUpsert,
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    const id = extractParamFromUrl(req, 'id')

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const existingRoutine = await routinesCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!existingRoutine || existingRoutine.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Routine not found or unauthorized' },
        { status: 404 },
      )
    }

    const result = await routinesCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json(
      { success: true, deletedCount: result.deletedCount },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
