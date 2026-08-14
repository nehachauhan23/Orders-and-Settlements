import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./db/connection";

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and configure it.");
  }

  await connectDB(MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB");

  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
