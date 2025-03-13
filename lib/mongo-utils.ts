import { getMongoClient, mongoDBConfig } from './mongo-client'

/**
 * Creates necessary indexes for the MongoDB collections.
 */
export async function createMongoDbIndexes(dbName: string) {
  console.log(`Ensuring indexes for db: ${dbName} ...`)
  const client = await getMongoClient()
  const db = client.db(dbName)

  const coll = mongoDBConfig.collections

  const collectionNames = (await db.listCollections().toArray()).map(
    (c) => c.name,
  )

  async function ensureIndex(collectionName: string, indexes: any[]) {
    if (!collectionNames.includes(collectionName)) {
      console.log(
        `Collection "${collectionName}" does not exist. Creating it...`,
      )
      await db.createCollection(collectionName)
    }
    await db.collection(collectionName).createIndexes(indexes)
  }

  await ensureIndex(coll.routines, [
    { key: { userId: 1 } },
    { key: { _id: 1 } },
  ])

  console.log('Indexes ensured successfully for db: ', dbName)
}
