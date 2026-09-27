import { Router, type IRouter } from "express";
import healthRouter from "./health";
import whitespaceRouter from "./whitespace";

const router: IRouter = Router();

router.use(healthRouter);
router.use(whitespaceRouter);

export default router;
