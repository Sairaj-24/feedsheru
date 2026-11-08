import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { PRIMARY_ROLES } from "./roles";

export const primaryRoleEnum = pgEnum("primary_role", PRIMARY_ROLES);

export const listingPathEnum = pgEnum("listing_path", [
  "needs_kitchen",
  "ready_to_feed",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "open",
  "claimed_by_maker",
  "ready",
  "claimed_by_distributor",
  "fed",
  "cancelled",
  "expired",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  cityArea: text("city_area"),
  phone: text("phone"),
  primaryRole: primaryRoleEnum("primary_role"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "date" }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerUserId: uuid("provider_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    quantityLabel: text("quantity_label").notNull(),
    cityArea: text("city_area").notNull(),
    pickupAddress: text("pickup_address").notNull(),
    pickupWindowStart: timestamp("pickup_window_start", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    pickupWindowEnd: timestamp("pickup_window_end", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    path: listingPathEnum("path").notNull(),
    status: listingStatusEnum("status").notNull().default("open"),
    makerUserId: uuid("maker_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    distributorUserId: uuid("distributor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("listings_provider_user_id_idx").on(table.providerUserId),
    index("listings_status_idx").on(table.status),
    index("listings_city_area_idx").on(table.cityArea),
    index("listings_maker_user_id_idx").on(table.makerUserId),
    index("listings_distributor_user_id_idx").on(table.distributorUserId),
  ],
);

export const listingEvents = pgTable(
  "listing_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fromStatus: listingStatusEnum("from_status"),
    toStatus: listingStatusEnum("to_status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("listing_events_listing_id_idx").on(table.listingId),
    index("listing_events_actor_user_id_idx").on(table.actorUserId),
  ],
);

export const feedLogs = pgTable(
  "feed_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    distributorUserId: uuid("distributor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quantityLabel: text("quantity_label").notNull(),
    animalsApprox: integer("animals_approx").notNull(),
    placeLabel: text("place_label").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("feed_logs_listing_id_idx").on(table.listingId),
    index("feed_logs_distributor_user_id_idx").on(table.distributorUserId),
  ],
);

export type { PrimaryRole } from "./roles";
export type ListingPath = (typeof listingPathEnum.enumValues)[number];
export type ListingStatus = (typeof listingStatusEnum.enumValues)[number];

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingEvent = typeof listingEvents.$inferSelect;
export type FeedLog = typeof feedLogs.$inferSelect;
