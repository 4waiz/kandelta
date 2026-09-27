import { Router, type IRouter } from "express";
import { AnalyzeMarketQueryParams, GetOpportunityQueryParams } from "@workspace/api-zod";
import { analyzeMarket } from "../lib/whitespace/analyze";
import { opportunityDetail } from "../lib/whitespace/opportunity";
import { OrianeUnavailableError } from "../lib/oriane/client";

const router: IRouter = Router();

router.get("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeMarketQueryParams.safeParse(req.query);
  const q = typeof req.query.q === "string" && parsed.success ? parsed.data.q.trim() : "";
  if (!q) {
    res.status(400).json({ error: "Describe a market, brand or audience." });
    return;
  }
  try {
    res.json(await analyzeMarket(q));
  } catch (err) {
    const unavailable = err instanceof OrianeUnavailableError;
    if (!unavailable) req.log.error({ err }, "Market analysis failed");
    res.status(unavailable ? 503 : 422).json({
      error: unavailable ? "Video intelligence temporarily unavailable." : (err as Error).message,
    });
  }
});

router.get("/opportunity", async (req, res): Promise<void> => {
  const parsed = GetOpportunityQueryParams.safeParse(req.query);
  const q = typeof req.query.q === "string" && parsed.success ? parsed.data.q.trim() : "";
  const id = typeof req.query.id === "string" && parsed.success ? parsed.data.id.trim() : "";
  if (!q || !id) {
    res.status(400).json({ error: "Missing query or opportunity id." });
    return;
  }
  try {
    res.json(await opportunityDetail(q, id));
  } catch (err) {
    const unavailable = err instanceof OrianeUnavailableError;
    if (!unavailable) req.log.error({ err }, "Opportunity detail failed");
    res.status(unavailable ? 503 : 422).json({
      error: unavailable ? "Video intelligence temporarily unavailable." : (err as Error).message,
    });
  }
});

export default router;