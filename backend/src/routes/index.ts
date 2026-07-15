import { Router } from "express";
import healthRouter from "./health.routes";
import contractsRouter from "./contracts.routes";
import historyRouter from "./history.routes";

const router = Router();

router.use(healthRouter);
router.use(contractsRouter);
router.use(historyRouter);

export default router;
