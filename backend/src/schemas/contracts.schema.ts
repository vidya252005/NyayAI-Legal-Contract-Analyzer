import { z } from "zod";

/**
 * Single source of truth for the contract-analysis domain shapes.
 *
 * The original project generated these from an OpenAPI spec via Orval,
 * which required a 3-package pipeline (api-spec -> api-zod -> api-client-react)
 * just to keep ~10 small schemas in sync. For a project this size that
 * indirection costs more than it buys, so the schemas are hand-written here
 * and imported directly by both routes and the Mongoose model layer.
 */

export const XaiExplanationSchema = z.object({
  word: z.string(),
  importance: z.number().min(0).max(1),
  reason: z.string(),
});

export const ClauseAnalysisSchema = z.object({
  clauseNumber: z.number().int(),
  clauseText: z.string(),
  clauseType: z.string(),
  riskLevel: z.enum(["Risky", "Moderate Risk", "Low Risk"]),
  riskScore: z.number().min(0).max(1),
  legalBasis: z.string(),
  explanation: z.string(),
  suggestion: z.string(),
  xaiExplanation: z.array(XaiExplanationSchema),
});

export const MissingClauseSchema = z.object({
  clauseName: z.string(),
  suggestion: z.string(),
  importance: z.enum(["Critical", "Recommended"]),
});

export const SocialFlagSchema = z.object({
  flaggedText: z.string(),
  explanation: z.string(),
});

export const AnalysisSummarySchema = z.object({
  totalClauses: z.number().int(),
  riskyClausesCount: z.number().int(),
  moderateRiskClausesCount: z.number().int(),
  overallRiskLevel: z.enum(["High", "Medium", "Low"]),
  overview: z.string().optional(),
});

export const ChangeLogEntrySchema = z.object({
  clauseNumber: z.number().int().nullable(),
  changeType: z.enum(["Modified", "Added", "Removed"]),
  original: z.string(),
  revised: z.string(),
  reason: z.string(),
});

export const RewrittenContractSchema = z.object({
  updatedContractText: z.string(),
  changeLog: z.array(ChangeLogEntrySchema),
});

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export const AnalyzeContractBody = z.object({
  contractText: z.string().min(1),
  contractType: z.string().min(1),
});
export type AnalyzeContractBody = z.infer<typeof AnalyzeContractBody>;

export const RewriteContractBody = z.object({
  contractText: z.string().min(1),
  contractType: z.string().min(1),
  clauses: z.array(ClauseAnalysisSchema),
  missingClauses: z.array(MissingClauseSchema),
});
export type RewriteContractBody = z.infer<typeof RewriteContractBody>;

export const RewriteContractResponse = RewrittenContractSchema;
export type RewriteContractResponse = z.infer<typeof RewriteContractResponse>;

export const ExportContentSchema = z.object({
  kind: z.enum(["report", "contract"]),
  contractType: z.string().optional(),
  summary: AnalysisSummarySchema.optional(),
  missingClauses: z.array(MissingClauseSchema).optional(),
  socialFlags: z.array(SocialFlagSchema).optional(),
  clauses: z.array(ClauseAnalysisSchema).optional(),
  updatedContractText: z.string().optional(),
  changeLog: z.array(ChangeLogEntrySchema).optional(),
});

export const ExportContractBody = z.object({
  format: z.enum(["pdf", "txt"]),
  fileNameBase: z.string().min(1),
  content: ExportContentSchema,
});
export type ExportContractBody = z.infer<typeof ExportContractBody>;

// ---------------------------------------------------------------------------
// Streamed NDJSON analysis events (server -> client)
// ---------------------------------------------------------------------------

export const AnalysisEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("summary"), data: AnalysisSummarySchema }),
  z.object({ type: z.literal("missingClause"), data: MissingClauseSchema }),
  z.object({ type: z.literal("socialFlag"), data: SocialFlagSchema }),
  z.object({ type: z.literal("clauseAnalysis"), data: ClauseAnalysisSchema }),
  z.object({ type: z.literal("error"), data: z.object({ message: z.string() }) }),
  z.object({ type: z.literal("done") }),
]);
export type AnalysisEvent = z.infer<typeof AnalysisEvent>;
