CREATE TABLE IF NOT EXISTS "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "system_settings" ("key", "value") VALUES
	('app_name', 'QBiz Gateway'),
	('app_logo_url', ''),
	('app_favicon_url', ''),
	('app_tagline', 'Dynamic QRIS Payment Gateway'),
	('footer_text', '© 2026 QBiz Gateway. All rights reserved.'),
	('invoice_expiry_minutes', '15'),
	('allow_demo_login', 'false'),
	('session_timeout_hours', '168'),
	('default_webhook_retry_limit', '3'),
	('maintenance_mode', 'false')
ON CONFLICT ("key") DO NOTHING;
