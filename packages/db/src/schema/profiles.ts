import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const leadStageEnum = pgEnum("lead_stage", [
  "cold",
  "pdf_buyer",
  "bp_buyer",
  "meeting_scheduled",
  "client",
  "lost",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  phone: text("phone"),
  cpfCnpj: text("cpf_cnpj"),
  city: text("city"),
  state: text("state"),
  leadScore: integer("lead_score").default(0),
  leadStage: leadStageEnum("lead_stage").default("cold"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  consentLgpdAt: timestamp("consent_lgpd_at", { withTimezone: true }),
  consentMarketingAt: timestamp("consent_marketing_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
