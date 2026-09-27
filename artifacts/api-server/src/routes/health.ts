import { Router, type IRouter } from "express";
import { HealthCheckResponse, GetWhiteSpaceHealthResponse } from "@workspace/api-zod";
import { cacheStatus } from "../lib/oriane/client";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res) => {
  res.json(GetWhiteSpaceHealthResponse.parse(cacheStatus()));
});

export default router;
