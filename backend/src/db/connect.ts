import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../lib/logger";

/**
 * MongoDB is optional infrastructure: the core analyze/rewrite/export flow
 * is stateless and works with zero database configured. When MONGODB_URI is
 * set, we additionally persist completed analyses so the frontend can offer
 * a history view. Connection state is tracked so /healthz and the history
 * routes can degrade gracefully instead of throwing when Mongo is absent
 * or briefly unreachable.
 */

export type DbStatus = "connected" | "disconnected" | "not_configured";

let status: DbStatus = env.MONGODB_URI ? "disconnected" : "not_configured";

export const getDbStatus = (): DbStatus => status;

export const connectDb = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    logger.info("MONGODB_URI not set — running without persistence (history disabled).");
    return;
  }

  mongoose.connection.on("connected", () => {
    status = "connected";
    logger.info("MongoDB connected");
  });

  mongoose.connection.on("disconnected", () => {
    status = "disconnected";
    logger.warn("MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    status = "disconnected";
    logger.error({ err }, "MongoDB connection error");
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    // Don't crash the whole API just because history storage is unavailable —
    // the primary contract-analysis feature doesn't depend on it.
    status = "disconnected";
    logger.error({ err }, "Failed to connect to MongoDB — continuing without persistence");
  }
};

export const disconnectDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
