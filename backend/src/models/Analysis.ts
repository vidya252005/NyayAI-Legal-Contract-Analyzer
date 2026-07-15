import { Schema, model, type InferSchemaType } from "mongoose";

const XaiExplanationSchema = new Schema(
  {
    word: { type: String, required: true },
    importance: { type: Number, required: true, min: 0, max: 1 },
    reason: { type: String, required: true },
  },
  { _id: false },
);

const ClauseAnalysisSchema = new Schema(
  {
    clauseNumber: { type: Number, required: true },
    clauseText: { type: String, required: true },
    clauseType: { type: String, required: true },
    riskLevel: {
      type: String,
      required: true,
      enum: ["Risky", "Moderate Risk", "Low Risk"],
    },
    riskScore: { type: Number, required: true, min: 0, max: 1 },
    legalBasis: { type: String, required: true },
    explanation: { type: String, required: true },
    suggestion: { type: String, required: true },
    xaiExplanation: { type: [XaiExplanationSchema], default: [] },
  },
  { _id: false },
);

const MissingClauseSchema = new Schema(
  {
    clauseName: { type: String, required: true },
    suggestion: { type: String, required: true },
    importance: { type: String, required: true, enum: ["Critical", "Recommended"] },
  },
  { _id: false },
);

const SocialFlagSchema = new Schema(
  {
    flaggedText: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
);

const ChangeLogEntrySchema = new Schema(
  {
    clauseNumber: { type: Number, default: null },
    changeType: { type: String, required: true, enum: ["Modified", "Added", "Removed"] },
    original: { type: String, required: true },
    revised: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false },
);

const analysisSchema = new Schema(
  {
    contractType: { type: String, required: true, index: true },
    // Full contract text is stored so a history entry can be re-opened for
    // rewrite/export later; it's never included in list responses (see
    // history.controller.ts) to keep list payloads small.
    contractText: { type: String, required: true },
    summary: {
      totalClauses: Number,
      riskyClausesCount: Number,
      moderateRiskClausesCount: Number,
      overallRiskLevel: { type: String, enum: ["High", "Medium", "Low"] },
      overview: String,
    },
    missingClauses: { type: [MissingClauseSchema], default: [] },
    socialFlags: { type: [SocialFlagSchema], default: [] },
    clauses: { type: [ClauseAnalysisSchema], default: [] },
    rewrittenContract: {
      updatedContractText: { type: String },
      changeLog: { type: [ChangeLogEntrySchema], default: undefined },
    },
  },
  { timestamps: true },
);

export type AnalysisDocument = InferSchemaType<typeof analysisSchema>;

export const Analysis = model("Analysis", analysisSchema);
