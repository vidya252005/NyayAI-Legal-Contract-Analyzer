import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.enum(["ok", "degraded"]),
  uptimeSeconds: z.number(),
  database: z.enum(["connected", "disconnected", "not_configured"]),
});
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
