import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm"; // ✅ ADD THIS

export const matchrouter = Router();
const MAX_LIMIT = 100;

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
      .orderBy(desc(matches.createdAt)) // ✅ correct
      .limit(limit);

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error: "failed to list", details: String(error) });
  }
});
