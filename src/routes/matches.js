import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

/**
 * Router handling match-related endpoints.
 * Base path: /matches
 */
export const matchrouter = Router();

const MAX_LIMIT = 100;

/**
 * GET /matches
 *
 * Returns matches ordered by creation time (latest first).
 * Optional query: ?limit=50 (max 100)
 */
matchrouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    return res.json({ data });
  } catch (error) {
    console.error("GET /matches failed:", error); // ✅ log server-side
    return res.status(500).json({ error: "failed to list" }); // ✅ no details
  }
});

/**
 * POST /matches
 *
 * Creates a new match.
 */
matchrouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload.",
      details: parsed.error.errors, // ✅ this is validation info, safe to return
    });
  }

  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    return res.status(201).json({ data: event });
  } catch (error) {
    console.error("POST /matches failed:", error); // ✅ log server-side
    return res.status(500).json({ error: "Failed to create match." }); // ✅ no details
  }
});
