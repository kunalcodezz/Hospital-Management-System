import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined. Starting in-memory MongoDB for local development...");
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB connected at: ${memoryUri}`);
      console.log("   ⚠️  Data will NOT persist across restarts. Set MONGODB_URI in .env for persistence.");
    } catch (error) {
      console.error("❌ Failed to start in-memory MongoDB:", error);
      console.error("   Install MongoDB locally or provide MONGODB_URI in .env");
    }
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error}`);
    // Not exiting process to allow mock mode fallback in preview
  }
};

// Graceful shutdown helper
export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
};
