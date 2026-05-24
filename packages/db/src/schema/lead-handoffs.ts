import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { businessPlans } from "./business-plans";
import { profiles } from "./profiles";

export const handoffStatusEnum = pgEnum("handoff_status", [
  "new",
  "contacted",
  "meeting_scheduled",
  "proposal_sent",
  "won",
  "lost",
]);

export const leadHandoffs = pgTable("lead_handoffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  businessPlanId: uuid("business_plan_id").references(() => businessPlans.id),
  source: text("source").notNull(),
  notes: text("notes"),
  assignedTo: text("assigned_to"),
  status: handoffStatusEnum("status").notNull().default("new"),
  meetingAt: timestamp("meeting_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
