import { Router } from "express";
import { analyzeContract, rewriteContract, exportContract } from "../controllers/contracts.controller";

const router = Router();

router.post("/contracts/analyze", analyzeContract);
router.post("/contracts/rewrite", rewriteContract);
router.post("/contracts/export", exportContract);

export default router;
