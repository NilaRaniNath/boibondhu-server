import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "boibondhu";

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  console.log(`Connected to MongoDB: ${DB_NAME}`);
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}
