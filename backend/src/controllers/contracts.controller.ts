import type { Request, Response } from "express";
import {
  AnalyzeContractBody,
  RewriteContractBody,
  RewriteContractResponse,
  ExportContractBody,
  AnalysisEvent,
} from "../schemas/contracts.schema";
import { ai, GEMINI_MODEL, GEMINI_THINKING_BUDGET } from "../lib/gemini";
import { buildAnalysisPrompt, buildRewritePrompt } from "../lib/contractPrompts";
import { JsonObjectStreamScanner, extractFirstJsonObject } from "../lib/jsonExtraction";
import { buildExportText, buildExportPdfBuffer } from "../lib/exportDocument";
import { Analysis } from "../models/Analysis";
import { getDbStatus } from "../db/connect";
import { logger } from "../lib/logger";

const GENERIC_REWRITE_FAILURE_MESSAGE =
  "Failed to generate a corrected contract. The contract might be too complex or there was an API issue. Please try again.";

/**
 * Fire-and-forget persistence of a completed analysis. Never awaited by the
 * request path and never allowed to affect the response — history is a
 * nice-to-have, not a dependency of the core analysis feature.
 */
const persistAnalysis = (doc: {
  contractType: string;
  contractText: string;
  summary: unknown;
  missingClauses: unknown[];
  socialFlags: unknown[];
  clauses: unknown[];
}): void => {
  if (getDbStatus() === "not_configured") return;

  Analysis.create(doc).catch((err) => {
    logger.warn({ err }, "Failed to persist analysis to history (non-fatal)");
  });
};

export const analyzeContract = async (req: Request, res: Response): Promise<void> => {
  const parsed = AnalyzeContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { contractText, contractType } = parsed.data;

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const prompt = buildAnalysisPrompt(contractText, contractType);

  let sawSummary = false;
  let sawClauseAnalysis = false;
  let sawDone = false;
  let sentTerminalError = false;

  // Accumulated for optional persistence once the stream completes cleanly.
  let summaryData: unknown = null;
  const missingClauseData: unknown[] = [];
  const socialFlagData: unknown[] = [];
  const clauseData: unknown[] = [];

  const emitError = (message: string): void => {
    if (sentTerminalError) return;
    sentTerminalError = true;
    res.write(`${JSON.stringify({ type: "error", data: { message } })}\n`);
  };

  const handleObject = (rawObjectText: string): void => {
    const cleaned = rawObjectText.trim();
    if (!cleaned) return;

    let obj: unknown;
    try {
      obj = JSON.parse(cleaned);
    } catch (err) {
      req.log?.warn({ err }, "Skipping unparseable JSON object from Gemini analysis stream");
      return;
    }

    const result = AnalysisEvent.safeParse(obj);
    if (!result.success) {
      req.log?.warn(
        { validationError: result.error.message },
        "Skipping NDJSON line that failed event schema validation",
      );
      return;
    }

    const event = result.data;
    if (event.type === "summary") {
      sawSummary = true;
      summaryData = event.data;
    }
    if (event.type === "missingClause") missingClauseData.push(event.data);
    if (event.type === "socialFlag") socialFlagData.push(event.data);
    if (event.type === "clauseAnalysis") {
      sawClauseAnalysis = true;
      clauseData.push(event.data);
    }
    if (event.type === "done") sawDone = true;

    res.write(`${JSON.stringify(event)}\n`);
  };

  try {
    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 65536,
        thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
      },
    });

    const scanner = new JsonObjectStreamScanner();
    let sawAnyOutput = false;
    let lastFinishReason: string | undefined;

    for await (const chunk of stream) {
      const candidateFinishReason = chunk.candidates?.[0]?.finishReason;
      if (candidateFinishReason) lastFinishReason = candidateFinishReason;

      const text = chunk.text;
      if (!text) continue;
      sawAnyOutput = true;

      for (const objectText of scanner.push(text)) {
        handleObject(objectText);
      }
    }

    const trailing = scanner.flush();
    if (trailing) {
      handleObject(trailing);
    }

    if (!sawAnyOutput) {
      req.log?.error({ lastFinishReason }, "Gemini analysis stream produced no output");
    } else if (lastFinishReason && lastFinishReason !== "STOP") {
      req.log?.warn({ lastFinishReason }, "Gemini analysis stream ended with a non-STOP finish reason");
    }

    if (!sawSummary || !sawClauseAnalysis) {
      emitError("The AI model returned an incomplete analysis (missing summary or clause data). Please try again.");
    } else {
      if (!sawDone) {
        res.write(`${JSON.stringify({ type: "done" })}\n`);
      }
      persistAnalysis({
        contractType,
        contractText,
        summary: summaryData,
        missingClauses: missingClauseData,
        socialFlags: socialFlagData,
        clauses: clauseData,
      });
    }

    res.end();
  } catch (err) {
    req.log?.error({ err }, "Gemini contract analysis stream failed");
    const message =
      err instanceof Error && err.message.includes("SAFETY")
        ? "The analysis was blocked due to safety concerns. Please review the contract for sensitive content and try again."
        : "Failed to get a valid analysis from the AI model. The contract might be too complex or there was an API issue.";
    if (!res.headersSent) {
      res.status(500).json({ error: message });
      return;
    }
    emitError(message);
    res.end();
  }
};

export const rewriteContract = async (req: Request, res: Response): Promise<void> => {
  const parsed = RewriteContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { contractText, contractType, clauses, missingClauses } = parsed.data;
  const flaggedClauses = clauses.filter((c) => c.riskLevel !== "Low Risk");

  const prompt = buildRewritePrompt(
    contractText,
    contractType,
    JSON.stringify(flaggedClauses),
    JSON.stringify(missingClauses),
  );

  // Gemini can occasionally truncate a long rewrite before producing valid,
  // complete JSON (hitting the output token cap on a long contract). Retry
  // once with an explicit nudge toward brevity before giving up.
  const attempts = [
    { maxOutputTokens: 65536, extraInstruction: "" },
    {
      maxOutputTokens: 65536,
      extraInstruction:
        "\n\nIMPORTANT: Your previous attempt was truncated before completing valid JSON. Be more concise in the 'reason' fields of the changeLog (one short sentence each) so the full response fits within the output limit, while still returning the complete updatedContractText.",
    },
  ];

  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex++) {
    const attempt = attempts[attemptIndex];
    const isLastAttempt = attemptIndex === attempts.length - 1;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `${prompt}${attempt.extraInstruction}`,
        config: {
          temperature: 0.1,
          maxOutputTokens: attempt.maxOutputTokens,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGET },
        },
      });

      const rawText = response.text ?? "";
      const finishReason = response.candidates?.[0]?.finishReason;
      const objectText = extractFirstJsonObject(rawText) ?? rawText.trim();

      let payload: unknown;
      try {
        payload = JSON.parse(objectText);
      } catch (err) {
        req.log?.warn(
          { err, rawTextLength: rawText.length, finishReason, attempt: attemptIndex },
          "Failed to parse Gemini rewrite response as JSON",
        );
        if (!isLastAttempt) continue;
        res.status(502).json({ error: GENERIC_REWRITE_FAILURE_MESSAGE });
        return;
      }

      const result = RewriteContractResponse.safeParse(payload);
      if (!result.success) {
        req.log?.warn(
          { err: result.error.message, finishReason, attempt: attemptIndex },
          "Gemini rewrite response failed schema validation",
        );
        if (!isLastAttempt) continue;
        res.status(502).json({ error: GENERIC_REWRITE_FAILURE_MESSAGE });
        return;
      }

      res.json(result.data);
      return;
    } catch (err) {
      req.log?.error({ err, attempt: attemptIndex }, "Gemini contract rewrite failed");
      const message =
        err instanceof Error && err.message.includes("SAFETY")
          ? "The rewrite was blocked due to safety concerns. Please review the contract for sensitive content and try again."
          : GENERIC_REWRITE_FAILURE_MESSAGE;
      res.status(500).json({ error: message });
      return;
    }
  }

  // Unreachable in practice (the loop always returns), but keeps TypeScript
  // happy that every path responds.
  res.status(500).json({ error: GENERIC_REWRITE_FAILURE_MESSAGE });
};

const sanitizeFileName = (name: string): string =>
  name
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "nyayai-export";

export const exportContract = async (req: Request, res: Response): Promise<void> => {
  const parsed = ExportContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { format, fileNameBase } = parsed.data;
  const safeName = sanitizeFileName(fileNameBase);

  try {
    if (format === "pdf") {
      const buffer = await buildExportPdfBuffer(parsed.data);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
      res.send(buffer);
      return;
    }

    const text = buildExportText(parsed.data);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.txt"`);
    res.send(text);
  } catch (err) {
    req.log?.error({ err }, "Failed to generate export document");
    res.status(500).json({ error: "Failed to generate the export file. Please try again." });
  }
};
