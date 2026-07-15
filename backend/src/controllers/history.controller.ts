import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Analysis } from "../models/Analysis";
import { getDbStatus } from "../db/connect";

const NOT_CONFIGURED_MESSAGE =
  "History is unavailable because no database is configured (MONGODB_URI not set).";

export const listHistory = async (req: Request, res: Response): Promise<void> => {
  if (getDbStatus() === "not_configured") {
    res.status(503).json({ error: NOT_CONFIGURED_MESSAGE });
    return;
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  try {
    const [items, total] = await Promise.all([
      Analysis.find({}, { contractText: 0, clauses: 0 })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Analysis.countDocuments(),
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    req.log?.error({ err }, "Failed to list analysis history");
    res.status(500).json({ error: "Failed to load history." });
  }
};

export const getHistoryItem = async (req: Request, res: Response): Promise<void> => {
  if (getDbStatus() === "not_configured") {
    res.status(503).json({ error: NOT_CONFIGURED_MESSAGE });
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid history id." });
    return;
  }

  try {
    const item = await Analysis.findById(id).lean();
    if (!item) {
      res.status(404).json({ error: "History entry not found." });
      return;
    }
    res.json(item);
  } catch (err) {
    req.log?.error({ err }, "Failed to load analysis history item");
    res.status(500).json({ error: "Failed to load history entry." });
  }
};

export const deleteHistoryItem = async (req: Request, res: Response): Promise<void> => {
  if (getDbStatus() === "not_configured") {
    res.status(503).json({ error: NOT_CONFIGURED_MESSAGE });
    return;
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid history id." });
    return;
  }

  try {
    const deleted = await Analysis.findByIdAndDelete(id).lean();
    if (!deleted) {
      res.status(404).json({ error: "History entry not found." });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log?.error({ err }, "Failed to delete analysis history item");
    res.status(500).json({ error: "Failed to delete history entry." });
  }
};
