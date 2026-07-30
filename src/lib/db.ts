import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;
let connecting: Promise<Db> | null = null;

async function connect(): Promise<Db> {
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "boibondhu";

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  const newClient = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await newClient.connect();
  client = newClient;
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);
  return db;
}

export async function connectDB(): Promise<Db> {
  if (db) return db;
  if (connecting) return connecting;

  connecting = connect().finally(() => { connecting = null; });
  return connecting;
}

export async function getDB(): Promise<Db> {
  if (db) return db;
  return connectDB();
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}
