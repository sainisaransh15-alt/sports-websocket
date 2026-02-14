import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
  matchIdParamSchema,
  createCommentarySchema,
  CommentaryQuerySchema,
} from "../validation/commentary.js";

export const commentaryRouter = Router();

const MAX_LIMIT = 100;

/**
 * POST /:matchId/commentary
 * (because we will mount it on /matches)
 */
commentaryRouter.post("/:matchId/commentary", async (req, res) => {
  // ✅ validate params
  const params = matchIdParamSchema.safeParse.call(
    matchIdParamSchema,
    req.params
  );

  if (!params.success) {
    return res.status(400).json({
      error: "Invalid params",
      details: params.error.issues,
    });
  }

  // ✅ validate body
  const body = createCommentarySchema.safeParse.call(
    createCommentarySchema,
    req.body
  );

  if (!body.success) {
    return res.status(400).json({
      error: "Invalid body",
      details: body.error.issues,
    });
  }

  const { matchId } = params.data;
  const payload = body.data;

  try {
    const [row] = await db
      .insert(commentary)
      .values({
        matchId,
        minute: payload.minutes,
        sequence: payload.sequence,
        period: payload.period,
        eventType: payload.eventType,
        actor: payload.actor,
        team: payload.team,
        message: payload.message,
        metadata: payload.metadata ?? null,
        tags: payload.tags
          ? JSON.stringify(payload.tags)
          : null,
      })
      .returning();

        if(res.app.locals.broadcastCommentary){
          res.app.locals.broadcastCommentary(row.matchId, row);
        }


    return res.status(201).json({ data: row });
  } catch (err) {
    console.error("Create commentary error:", err);
    return res.status(500).json({ error: "Service unavailable" });
  }
});

/**
 * GET /:matchId/commentary
 * Returns commentary for a specific match, ordered by createdAt DESC.
 * Optional query: ?limit=50 (max 100)
 */
commentaryRouter.get("/:matchId/commentary", async (req, res) => {
  // Validate params
  const params = matchIdParamSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({
      error: "Invalid params",
      details: params.error.issues,
    });
  }

  // Validate query
  const query = CommentaryQuerySchema.safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: query.error.issues,
    });
  }

  const { matchId } = params.data;
  const limit = Math.min(query.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.json({ data });
  } catch (error) {
    console.error("GET /:matchId/commentary failed:", error);
    return res.status(500).json({ error: "Failed to fetch commentary" });
  }
});
