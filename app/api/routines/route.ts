import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect to MongoDB
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    // Query the "routines" collection for documents created by the user
    const routines = await routinesCollection
      .find({ userId: session.user.id })
      .toArray()

    // Return the routines as JSON
    return NextResponse.json(routines, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
