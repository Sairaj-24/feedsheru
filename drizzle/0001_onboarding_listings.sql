CREATE TYPE "primary_role" AS ENUM('provider', 'maker', 'distributor');
--> statement-breakpoint
CREATE TYPE "listing_path" AS ENUM('needs_kitchen', 'ready_to_feed');
--> statement-breakpoint
CREATE TYPE "listing_status" AS ENUM('open', 'claimed_by_maker', 'ready', 'claimed_by_distributor', 'fed', 'cancelled', 'expired');
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city_area" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "primary_role" "primary_role";
--> statement-breakpoint
CREATE TABLE "listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider_user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "quantity_label" text NOT NULL,
  "city_area" text NOT NULL,
  "pickup_address" text NOT NULL,
  "pickup_window_start" timestamptz NOT NULL,
  "pickup_window_end" timestamptz NOT NULL,
  "path" "listing_path" NOT NULL,
  "status" "listing_status" DEFAULT 'open' NOT NULL,
  "maker_user_id" uuid,
  "distributor_user_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "listings_provider_user_id_users_id_fk"
    FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "listings_maker_user_id_users_id_fk"
    FOREIGN KEY ("maker_user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "listings_distributor_user_id_users_id_fk"
    FOREIGN KEY ("distributor_user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "listing_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "from_status" "listing_status",
  "to_status" "listing_status" NOT NULL,
  "note" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "listing_events_listing_id_listings_id_fk"
    FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "listing_events_actor_user_id_users_id_fk"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "feed_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL,
  "distributor_user_id" uuid NOT NULL,
  "quantity_label" text NOT NULL,
  "animals_approx" integer NOT NULL,
  "place_label" text NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "feed_logs_listing_id_listings_id_fk"
    FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "feed_logs_distributor_user_id_users_id_fk"
    FOREIGN KEY ("distributor_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "listings_provider_user_id_idx" ON "listings" ("provider_user_id");
--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" ("status");
--> statement-breakpoint
CREATE INDEX "listings_city_area_idx" ON "listings" ("city_area");
--> statement-breakpoint
CREATE INDEX "listings_maker_user_id_idx" ON "listings" ("maker_user_id");
--> statement-breakpoint
CREATE INDEX "listings_distributor_user_id_idx" ON "listings" ("distributor_user_id");
--> statement-breakpoint
CREATE INDEX "listing_events_listing_id_idx" ON "listing_events" ("listing_id");
--> statement-breakpoint
CREATE INDEX "listing_events_actor_user_id_idx" ON "listing_events" ("actor_user_id");
--> statement-breakpoint
CREATE INDEX "feed_logs_listing_id_idx" ON "feed_logs" ("listing_id");
--> statement-breakpoint
CREATE INDEX "feed_logs_distributor_user_id_idx" ON "feed_logs" ("distributor_user_id");
