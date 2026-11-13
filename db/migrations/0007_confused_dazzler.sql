ALTER TABLE "invoices" ADD COLUMN "client_dialect" text DEFAULT 'QBIZ' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "client_metadata" text;