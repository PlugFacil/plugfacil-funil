import { bigserial, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const events = pgTable("events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id),
  eventName: text("event_name").notNull(),
  properties: jsonb("properties").default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow(),
});
