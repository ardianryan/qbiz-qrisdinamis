CREATE TABLE IF NOT EXISTS "merchant_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"telegram_enabled" boolean DEFAULT false NOT NULL,
	"telegram_bot_token" text,
	"telegram_chat_id" text,
	"telegram_template" text,
	"discord_enabled" boolean DEFAULT false NOT NULL,
	"discord_webhook_url" text,
	"discord_template" text,
	"whatsapp_enabled" boolean DEFAULT false NOT NULL,
	"whatsapp_api_url" text,
	"whatsapp_auth_type" text DEFAULT 'NONE' NOT NULL,
	"whatsapp_auth_key" text,
	"whatsapp_recipient" text,
	"whatsapp_template" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_notifications_merchant_id_unique" UNIQUE("merchant_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "merchant_notifications" ADD CONSTRAINT "merchant_notifications_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
