import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(uri: string): Promise<void> {
  if (isConnected) return;

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  isConnected = true;

  mongoose.connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
  });
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

/**
 * Whether the current MongoDB deployment supports multi-document
 * transactions (requires a replica set / mongos, which Atlas provides
 * on all shared and dedicated tiers). Standalone local `mongod` instances
 * do not support transactions, which matters for local dev and for the
 * test environment (mongodb-memory-server can spin up a single-node
 * replica set to support this).
 */
export function supportsTransactions(): boolean {
  const topology = (mongoose.connection as any)?.client?.topology;
  return Boolean(topology);
}
