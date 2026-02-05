CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TABLE "commentary" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer,
	"minute" integer,
	"sequence" integer,
	"period" varchar(50),
	"event_type" varchar(100),
	"actor" varchar(256),
	"team" varchar(256),
	"message" text,
	"metadata" jsonb,
	"tags" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" varchar(256),
	"home_team" varchar(256),
	"away_team" varchar(256),
	"status" "match_status",
	"start_time" timestamp,
	"end_time" timestamp,
	"home_score" integer DEFAULT 0,
	"away_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;