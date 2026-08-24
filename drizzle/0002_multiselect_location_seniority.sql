ALTER TABLE "search" DROP COLUMN "location";
ALTER TABLE "search" DROP COLUMN "seniority";
ALTER TABLE "search" ADD COLUMN "locations" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "search" ADD COLUMN "seniorities" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "search" ALTER COLUMN "locations" DROP DEFAULT;
ALTER TABLE "search" ALTER COLUMN "seniorities" DROP DEFAULT;
