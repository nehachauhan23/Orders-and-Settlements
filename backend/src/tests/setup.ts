import { beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not set. Copy backend/.env.test.example to backend/.env.test and point it at a replica set dedicated to testing."
  );
}
process.env.JWT_SECRET ||= "test-secret-do-not-use-in-production";
process.env.JWT_EXPIRES_IN ||= "1h";
process.env.COOKIE_NAME ||= "opt_token";
process.env.NODE_ENV ||= "test";

const dbName = new URL(MONGODB_URI.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"))
  .pathname.replace(/^\//, "")
  .split("?")[0];

if (!/test/i.test(dbName) && process.env.ALLOW_UNSAFE_TEST_DB !== "true") {
  throw new Error(
    `MONGODB_URI's database name ("${dbName || "(none)"}") doesn't contain "test". ` +
      "Every test wipes all collections after it runs — refusing to connect to what " +
      "looks like it might not be a disposable test database. If this really is a " +
      "safe-to-wipe database, set ALLOW_UNSAFE_TEST_DB=true to proceed."
  );
}

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
