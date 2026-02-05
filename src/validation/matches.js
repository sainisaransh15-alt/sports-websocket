import { z } from 'zod';

// Constant for match statuses
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Schema for listing matches query parameters
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Schema for match ID parameter
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Schema for creating a match
export const createMatchSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  startTime: z.string(),
  endTime: z.string(),
  homeScore: z.coerce.number().int().nonnegative().optional(),
  awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
  // Validate ISO date strings
  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);

  if (isNaN(startDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startTime must be a valid ISO date string',
      path: ['startTime'],
    });
  }

  if (isNaN(endDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endTime must be a valid ISO date string',
      path: ['endTime'],
    });
  }

  // Ensure endTime is after startTime
  if (startDate >= endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endTime must be after startTime',
      path: ['endTime'],
    });
  }
});

// Schema for updating scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});