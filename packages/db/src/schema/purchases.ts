import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const productKindEnum = pgEnum("product_kind", [
  "pdf_mercado",
  "business_plan",
  "consultoria",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id),
  product: productKindEnum("product").notNull(),
  status: purchaseStatusEnum("status").notNull().default("pending"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("BRL"),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
