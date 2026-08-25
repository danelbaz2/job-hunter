ALTER TABLE "search" ADD COLUMN "completedAt" timestamp;
--> statement-breakpoint
-- Every row that already exists was created under the old code path, where the
-- client only ever learned a searchId after the full pipeline (scoring included)
-- had finished — so every existing row is already complete. Without this backfill,
-- old searches would look permanently "still scoring" to the new poll-based
-- results page.
UPDATE "search" SET "completedAt" = "createdAt" WHERE "completedAt" IS NULL;