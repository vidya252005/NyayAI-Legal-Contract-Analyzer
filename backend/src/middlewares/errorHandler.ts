import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

/**
 * Last-resort error handler. Route handlers in this app mostly catch their
 * own errors (Gemini calls, PDF generation, etc.) and respond with a
 * specific message, but this exists as a safety net so an unexpected thrown
 * error never leaks a stack trace to the client or crashes the process.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  if (res.headersSent) {
    res.end();
    return;
  }

  res.status(500).json({ error: "An unexpected server error occurred." });
};
