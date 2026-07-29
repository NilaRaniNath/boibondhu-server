import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;
let connecting: Promise<Db> | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  if (connecting) return connecting;

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "boibondhu";

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  connecting = (async () => {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Connected to MongoDB: ${DB_NAME}`);
    return db;
  })();

  return connecting;
}

export async function getDB(): Promise<Db> {
  if (db) return db;
  if (connecting) return connecting;
  throw new Error("Database not initialized. Call connectDB() first.");
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}
