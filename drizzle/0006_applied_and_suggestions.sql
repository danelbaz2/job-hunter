CREATE TABLE IF NOT EXISTS "applied_job" (
	"userId" uuid NOT NULL,
	"searchResultId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applied_job_userId_searchResultId_pk" PRIMARY KEY("userId","searchResultId")
);
--> statement-breakpoint
ALTER TABLE "search_result" ADD COLUMN "resumeSuggestions" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applied_job" ADD CONSTRAINT "applied_job_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applied_job" ADD CONSTRAINT "applied_job_searchResultId_search_result_id_fk" FOREIGN KEY ("searchResultId") REFERENCES "public"."search_result"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
