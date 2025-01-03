import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, mongoDBConfig } from '@/lib/mongoClient'
import { ObjectId } from 'mongodb'
import { extractParamFromUrl } from '@/lib/utils'

// GET, PATCH, DELETE for a specific routine
export async function GET(req: NextRequest) {
  const user = getAuth(req)
  const id = extractParamFromUrl(req, 'id')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  try {
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const routine = await routinesCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!routine || routine.userId !== user.userId) {
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
  const user = getAuth(req)
  const id = extractParamFromUrl(req, 'id')

  try {
    if (!user?.userId) {
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
      userId: user.userId,
      updatedAt: new Date(),
    }

    if (!existingRoutine) {
      routinesCollection.insertOne(routineToUpsert)
      return NextResponse.json(
        { success: true, updatedCount: 1, updatedRoutine: routineToUpsert },
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
  const user = getAuth(req)
  const id = extractParamFromUrl(req, 'id')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  try {
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    const existingRoutine = await routinesCollection.findOne({
      _id: new ObjectId(id),
    })

    if (!existingRoutine || existingRoutine.userId !== user.userId) {
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
