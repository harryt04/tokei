import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'

export async function GET(req: NextRequest) {
  const auth = getAuth(req)
  try {
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user details from Clerk
    const user = await clerkClient.users.getUser(auth.userId)
    const email = user.emailAddresses?.[0]?.emailAddress

    if (email) {
      fetch('https://harryt.dev/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'tokei' }),
      }).catch(() => {
        // Ignore errors from this call
      })
    }

    // Connect to MongoDB
    const client = await getMongoClient()
    const db = client.db(mongoDBConfig.dbName)
    const routinesCollection = db.collection(mongoDBConfig.collections.routines)

    // Query the "routines" collection for documents created by the user
    const routines = await routinesCollection
      .find({ userId: auth.userId })
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
