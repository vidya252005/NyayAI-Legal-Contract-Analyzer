import { Router } from "express";
import { listHistory, getHistoryItem, deleteHistoryItem } from "../controllers/history.controller";

const router = Router();

router.get("/history", listHistory);
router.get("/history/:id", getHistoryItem);
router.delete("/history/:id", deleteHistoryItem);

export default router;
