import { z } from "zod";

// GET query schema: ?limit=10
export const CommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// /matches/:matchId
export const matchIdParamSchema = z.object({
  matchId: z.coerce.number().int().positive(),
});

// POST body schema
export const createCommentarySchema = z.object({
  minutes: z.coerce.number().int().min(0),
  sequence: z.coerce.number().int().min(0),
  period: z.string(),
  eventType: z.string(),
  actor: z.string(),
  team: z.string(),
  message: z.string().min(1),

  // ✅ fixed line
  metadata: z.record(z.string(), z.any()).optional().nullable(),

  tags: z.array(z.string()).optional(),
});
