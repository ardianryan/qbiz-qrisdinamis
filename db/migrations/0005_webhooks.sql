CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"merchant_id" text REFERENCES "merchants"("id") ON DELETE CASCADE,
	"events" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"last_status_code" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
