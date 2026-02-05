import { pgTable, serial, text, varchar, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

// Define the match_status enum
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  sport: varchar("sport", { length: 256 }),
  homeTeam: varchar("home_team", { length: 256 }),
  awayTeam: varchar("away_team", { length: 256 }),
  status: matchStatusEnum("status"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commentary table
export const commentary = pgTable("commentary", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id),
  minute: integer("minute"),
  sequence: integer("sequence"),
  period: varchar("period", { length: 50 }),
  eventType: varchar("event_type", { length: 100 }),
  actor: varchar("actor", { length: 256 }),
  team: varchar("team", { length: 256 }),
  message: text("message"),
  metadata: jsonb("metadata"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

