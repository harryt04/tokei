import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import { getMongoClient, mongoDBConfig } from '@/lib/mongo-client'

const client = await getMongoClient()
const db = client.db(mongoDBConfig.dbName)

export const auth = betterAuth({
  database: mongodbAdapter(db, { client, transaction: false }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
})
