import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { connectDb, disconnectDb } from "./db/connect";

const start = async (): Promise<void> => {
  // Never let a slow/unreachable MongoDB delay the API from serving the
  // stateless contract-analysis endpoints — connectDb() resolves even on
  // failure (see db/connect.ts), it just logs and leaves history disabled.
  await connectDb();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "NyayAI API server listening");
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  logger.error({ err }, "Fatal error during server startup");
  process.exit(1);
});
