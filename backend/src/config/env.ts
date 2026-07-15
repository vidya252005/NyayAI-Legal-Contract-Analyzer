import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 *
 * The app fails fast on boot if required variables are missing or malformed,
 * instead of surfacing confusing errors deep inside request handlers later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  // Gemini 2.5 models "think" before producing visible output, and unless
  // this is set explicitly the SDK lets the model dynamically spend up to
  // 8192 tokens doing so (google.dev/gemini-api/docs/thinking) -- on a
  // streaming endpoint that shows up as dead air before the first NDJSON
  // line arrives. Our prompts already hand the model an explicit rubric
  // (which statute/section applies, what counts as "Risky", etc.), so a
  // capped budget is enough for genuine per-clause judgment calls without
  // paying for open-ended deliberation. 0 disables thinking entirely; -1
  // restores the fully-dynamic default.
  GEMINI_THINKING_BUDGET: z.coerce.number().int().min(-1).default(1024),
  // MongoDB is optional: the app runs perfectly well with zero persistence
  // (the core analyze/rewrite/export flow never touches the DB). When set,
  // analyses are additionally saved so users can browse history.
  MONGODB_URI: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
  LOG_LEVEL: z.string().default("info"),
  JSON_BODY_LIMIT: z.string().default("15mb"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env: Env = parsed.data;
