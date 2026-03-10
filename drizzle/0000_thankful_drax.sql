CREATE TYPE "public"."audience" AS ENUM('BDR', 'SAM', 'SE', 'All', 'Other');--> statement-breakpoint
CREATE TYPE "public"."enablement_type" AS ENUM('Async', 'Live', 'Certification');--> statement-breakpoint
CREATE TYPE "public"."improvement_area" AS ENUM('Build Foundational Knowledge & Role Readiness', 'Improve Pipeline / Stage Progression Speed', 'Strengthen Technical Proficiency', 'Optimize Resolution Rates & Channel Utilization', 'Improve Customer Communication', 'Increase Revenue / Business Impact');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('High', 'Medium', 'Low');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('intake', 'slack');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('submitted', 'suggested', 'accepted', 'hold', 'scheduled', 'completed', 'deprioritized');--> statement-breakpoint
CREATE TABLE "enablements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"submitter" text,
	"details" text,
	"audience" "audience",
	"priority" "priority",
	"ideal_date" date,
	"type" "enablement_type",
	"improvement_area" "improvement_area",
	"owner" text,
	"planning_doc_link" text,
	"scheduled_date" timestamp,
	"status" "status" DEFAULT 'submitted' NOT NULL,
	"source" "source" DEFAULT 'intake' NOT NULL,
	"source_slack_channel" text,
	"source_slack_link" text,
	"source_slack_author" text,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"enablement_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_scan_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"channels_scanned" integer NOT NULL,
	"messages_found" integer NOT NULL,
	"signals_generated" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_of" date NOT NULL,
	"summary" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enablements" ADD CONSTRAINT "enablements_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_enablement_id_enablements_id_fk" FOREIGN KEY ("enablement_id") REFERENCES "public"."enablements"("id") ON DELETE no action ON UPDATE no action;