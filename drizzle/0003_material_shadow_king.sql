CREATE TYPE "public"."activity_team" AS ENUM('education', 'enablement');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('live_session', 'async', 'asset', 'other');--> statement-breakpoint
CREATE TYPE "public"."launch_status" AS ENUM('planning', 'in_progress', 'shipped', 'archived');--> statement-breakpoint
CREATE TYPE "public"."launch_tier" AS ENUM('small', 'medium', 'large_xl');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('planning', 'in_progress', 'done', 'archived');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"launch_id" uuid,
	"request_id" uuid,
	"team" "activity_team" NOT NULL,
	"category" text,
	"name" text NOT NULL,
	"type" "activity_type" NOT NULL,
	"owner" text,
	"due_date" timestamp,
	"scheduled_date" timestamp,
	"asset_url" text,
	"completed" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "launch_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"launch_id" uuid NOT NULL,
	"track_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tier" "launch_tier" NOT NULL,
	"status" "launch_status" DEFAULT 'planning' NOT NULL,
	"target_date" timestamp,
	"notion_brief_url" text,
	"planning_doc_url" text,
	"goal" text,
	"learning_objectives" jsonb,
	"kirkpatrick" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "programming_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"audience" text,
	"owner" text,
	"status" "request_status" DEFAULT 'planning' NOT NULL,
	"type" "activity_type",
	"due_date" timestamp,
	"planning_doc_url" text,
	"requested_by" text,
	"request_source" text,
	"ai_scan_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_launch_id_launches_id_fk" FOREIGN KEY ("launch_id") REFERENCES "public"."launches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "launch_tracks" ADD CONSTRAINT "launch_tracks_launch_id_launches_id_fk" FOREIGN KEY ("launch_id") REFERENCES "public"."launches"("id") ON DELETE cascade ON UPDATE no action;