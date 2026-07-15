import type { Request, Response } from "express";
import { HealthCheckResponse } from "../schemas/health.schema";
import { getDbStatus } from "../db/connect";

export const healthCheck = (_req: Request, res: Response): void => {
  const database = getDbStatus();
  const status = database === "disconnected" ? "degraded" : "ok";

  const data = HealthCheckResponse.parse({
    status,
    uptimeSeconds: Math.round(process.uptime()),
    database,
  });

  res.status(status === "ok" ? 200 : 503).json(data);
};
