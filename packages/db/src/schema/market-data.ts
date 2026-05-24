import { integer, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const frotaEvMunicipio = pgTable(
  "frota_ev_municipio",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    uf: text("uf").notNull(),
    municipio: text("municipio").notNull(),
    ano: integer("ano").notNull(),
    mes: integer("mes").notNull(),
    bev: integer("bev").default(0),
    phev: integer("phev").default(0),
    hev: integer("hev").default(0),
    fonte: text("fonte").default("ABVE"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.uf, t.municipio, t.ano, t.mes)],
);

export const tarifasDistribuidora = pgTable("tarifas_distribuidora", {
  id: uuid("id").primaryKey().defaultRandom(),
  distribuidora: text("distribuidora").notNull(),
  uf: text("uf").notNull(),
  classe: text("classe").notNull(),
  tarifaTeKwh: numeric("tarifa_te_kwh", { precision: 8, scale: 4 }),
  tarifaTusdKwh: numeric("tarifa_tusd_kwh", { precision: 8, scale: 4 }),
  bandeira: text("bandeira").default("verde"),
  vigenciaInicio: text("vigencia_inicio"),
  vigenciaFim: text("vigencia_fim"),
  fonteUrl: text("fonte_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
