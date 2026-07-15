import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { env } from "./config/env";
import { notFoundHandler } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

const app: Express = express();

// Behind a reverse proxy (Nginx, Render, Railway, etc.) in production so
// req.ip / rate limiting see the real client IP instead of the proxy's.
app.set("trust proxy", 1);

app.use(
  helmet({
    // The frontend is served separately (its own dev server, or a static
    // host/CDN in production) — this API never serves HTML, so a strict CSP
    // meant for pages would only get in the way here.
    contentSecurityPolicy: false,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  }),
);

app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));

// The Gemini-backed endpoints are the only meaningfully expensive/costly
// operations this API exposes, so they get a dedicated, tighter rate limit
// rather than one blanket limiter for every route (health checks and history
// reads shouldn't compete with analysis requests for the same budget).
const aiRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analysis requests. Please wait a few minutes and try again." },
});
app.use("/api/contracts", aiRouteLimiter);

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
