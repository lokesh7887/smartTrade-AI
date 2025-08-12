import { MongoClient, type Db } from "mongodb"

let clientPromise: Promise<MongoClient> | null = null

async function getClient(): Promise<MongoClient> {
  if (clientPromise) return clientPromise

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local")
  }

  const options = {}

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    const client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  return clientPromise
}

export default async function getClientPromise(): Promise<MongoClient> {
  return getClient()
}

export async function getDatabase(): Promise<Db> {
  const client = await getClient()
  return client.db("smarttrade_ai")
}

export async function connectToDatabase(): Promise<Db> {
  const client = await getClient()
  return client.db("smarttrade_ai")
}
