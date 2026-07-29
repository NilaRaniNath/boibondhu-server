import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;
let connecting: Promise<Db> | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "boibondhu";

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const newClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      await newClient.connect();
      client = newClient;
      db = client.db(DB_NAME);
      console.log(`Connected to MongoDB: ${DB_NAME} (attempt ${attempt})`);
      connecting = null;
      return db;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`, (err as Error).message);
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        connecting = null;
        throw err;
      }
    }
  }

  throw new Error("MongoDB connection failed after all retries");
}

export async function getDB(): Promise<Db> {
  if (db) return db;
  throw new Error("Database not initialized. Call connectDB() first.");
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}
