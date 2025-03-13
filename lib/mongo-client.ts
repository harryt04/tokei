import { MongoClient } from 'mongodb'
const defaultConnectionString =
  'mongodb://root:1fcjnTP3OyVsBHssEycs1NjUuYLk9nvSU0Qv2ZN49xhOdSNoli7WIYyTRU89EP0O@192.168.86.32:6000/?directConnection=true' // put your MONGO_CONNECTION_STRING here when running npm run create-indexes

const MONGO_CONNECTION_STRING =
  process.env.MONGO_CONNECTION_STRING ?? defaultConnectionString

if (!MONGO_CONNECTION_STRING) {
  throw new Error('MONGO_CONNECTION_STRING environment variable is not set.')
}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

// Singleton pattern to reuse MongoDB client across requests
export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGO_CONNECTION_STRING)
    clientPromise = client.connect()
  }
  if (clientPromise) {
    await clientPromise
  }
  return client
}

export const mongoDBConfig = {
  dbName: `tokei-${process.env.NODE_ENV}`,
  collections: {
    routines: 'routines',
  },
}
