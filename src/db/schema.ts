import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  index,
} from "drizzle-orm/pg-core";

/**
 * Controlled-vocabulary analysis produced by the AI vision agent for each
 * image scraped from the FB group. Both the victim form and the dataset use
 * the SAME vocabulary (see src/lib/vocabulary.ts) so matching is exact-token
 * based rather than fuzzy prose comparison.
 */
export type ImageAnalysis = {
  bikeType?: string; // road | mountain | gravel | hybrid | ebike | cargo | kids | folding | cruiser | fixie | bmx | unknown
  brand?: string; // free text normalized, e.g. "Trek"
  model?: string;
  frameColor?: string; // FRAME_COLORS id
  secondaryColors?: string[]; // FRAME_COLORS ids
  handlebarType?: string; // HANDLEBAR_TYPES id
  accessories?: string[]; // ACCESSORIES ids
  lockType?: string; // LOCK_TYPES id
  saddleColor?: string;
  gripColor?: string;
  distinctiveFeatures?: string[]; // free text tokens: "rainbow sticker downtube"
  serialVisible?: string | null;
  frameSizeGuess?: string;
  confidence?: number; // 0..1 from the vision model
  notes?: string;
};

/** Stolen-bike reports registered by victims. */
export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 16 }).notNull().unique(),
    bikeType: varchar("bike_type", { length: 32 }).notNull(),
    brand: varchar("brand", { length: 120 }).default(""),
    model: varchar("model", { length: 160 }).default(""),
    year: varchar("year", { length: 16 }).default(""),
    frameColor: varchar("frame_color", { length: 32 }).default(""),
    frameColorHex: varchar("frame_color_hex", { length: 16 }).default(""),
    secondaryColor: text("secondary_color").default(""),
    frameSize: varchar("frame_size", { length: 16 }).default(""),
    handlebarType: varchar("handlebar_type", { length: 32 }).default(""),
    serialNumber: varchar("serial_number", { length: 80 }).default(""),
    stickersDecals: text("stickers_decals").default(""),
    damage: text("damage").default(""),
    damageSpots: jsonb("damage_spots").$type<{ x: number; y: number; note: string }[]>().default([]),
    accessories: jsonb("accessories").$type<string[]>().default([]),
    lockType: varchar("lock_type", { length: 32 }).default(""),
    lockColor: varchar("lock_color", { length: 120 }).default(""),
    saddleColor: varchar("saddle_color", { length: 40 }).default(""),
    gripColor: varchar("grip_color", { length: 40 }).default(""),
    ownerName: varchar("owner_name", { length: 120 }).notNull(),
    contactEmail: varchar("contact_email", { length: 160 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 40 }).default(""),
    theftDate: varchar("theft_date", { length: 16 }).default(""),
    theftLocation: text("theft_location").default(""),
    additionalNotes: text("additional_notes").default(""),
    uniquenessScore: integer("uniqueness_score").default(0),
    status: varchar("status", { length: 16 }).default("open"), // open | recovered | closed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reports_brand_idx").on(t.brand), index("reports_serial_idx").on(t.serialNumber)],
);

/**
 * The bike catalog: brand -> model -> colorway -> sizes, sourced from Reykjavík
 * shop storefronts (Shopify /products.json, WooCommerce Store API) and then
 * handed to Apify to fetch reference images. Powers the searchable
 * brand/model picker in the configurator.
 */
export const catalogBikes = pgTable(
  "catalog_bikes",
  {
    id: serial("id").primaryKey(),
    brand: varchar("brand", { length: 120 }).notNull(),
    model: varchar("model", { length: 160 }).notNull(),
    year: varchar("year", { length: 16 }).default(""),
    bikeType: varchar("bike_type", { length: 32 }).default("unknown"),
    colorName: varchar("color_name", { length: 120 }).default(""), // shop's colorway name
    frameColor: varchar("frame_color", { length: 32 }).default(""), // normalized FRAME_COLORS id
    sizes: jsonb("sizes").$type<string[]>().default([]),
    shop: varchar("shop", { length: 80 }).default(""), // e.g. "Örninn"
    sourceUrl: text("source_url").default(""),
    imageUrl: text("image_url").default(""), // filled by Apify reference-image job
    priceIsk: integer("price_isk"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("catalog_brand_idx").on(t.brand), index("catalog_model_idx").on(t.model)],
);

/**
 * Every image scraped from "Hjóladót ofl tapað, fundið eða stolið" plus the
 * structured analysis produced by the vision agent.
 */
export const datasetImages = pgTable(
  "dataset_images",
  {
    id: serial("id").primaryKey(),
    externalId: varchar("external_id", { length: 160 }).unique(), // fb post id + image index
    imageUrl: text("image_url").notNull(),
    postUrl: text("post_url").default(""),
    postText: text("post_text").default(""),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postKind: varchar("post_kind", { length: 16 }).default("unknown"), // found | stolen | lost | unknown
    analysis: jsonb("analysis").$type<ImageAnalysis>().notNull().default({}),
    searchText: text("search_text").default(""), // flattened tokens for LIKE / trigram search
    isDemo: boolean("is_demo").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("dataset_kind_idx").on(t.postKind), index("dataset_posted_idx").on(t.postedAt)],
);

/** Victim feedback on a proposed match — trains thresholds later. */
export const matchFeedback = pgTable("match_feedback", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  imageId: integer("image_id").notNull(),
  verdict: varchar("verdict", { length: 16 }).notNull(), // mine | not_mine
  score: real("score").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type CatalogBike = typeof catalogBikes.$inferSelect;
export type DatasetImage = typeof datasetImages.$inferSelect;
