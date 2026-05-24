import {
  doublePrecision,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { purchases } from "./purchases";

export const bpStatusEnum = pgEnum("bp_status", [
  "draft",
  "submitted",
  "processing",
  "review_needed",
  "completed",
  "failed",
]);

export const tipoLocalEnum = pgEnum("tipo_local", [
  "condominio_residencial",
  "condominio_comercial",
  "posto_combustivel",
  "shopping",
  "supermercado",
  "hotel_pousada",
  "estacionamento",
  "concessionaria",
  "outros",
]);

export const businessPlans = pgTable("business_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => purchases.id),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  status: bpStatusEnum("status").notNull().default("draft"),

  // Endereço
  enderecoCep: text("endereco_cep"),
  enderecoLogradouro: text("endereco_logradouro"),
  enderecoNumero: text("endereco_numero"),
  enderecoComplemento: text("endereco_complemento"),
  enderecoBairro: text("endereco_bairro"),
  enderecoMunicipio: text("endereco_municipio"),
  enderecoUf: text("endereco_uf"),
  enderecoLat: doublePrecision("endereco_lat"),
  enderecoLng: doublePrecision("endereco_lng"),

  tipoLocal: tipoLocalEnum("tipo_local"),

  // Análise visual da vaga
  fotoVagaPath: text("foto_vaga_path"),
  vagaAnalise: jsonb("vaga_analise"),

  // Análise elétrica do padrão
  fotoPadraoPath: text("foto_padrao_path"),
  padraoAnalise: jsonb("padrao_analise"),
  padraoInputManual: jsonb("padrao_input_manual"),

  // Cenário energético
  cenariosSelecionados: text("cenarios_selecionados").array().default(["convencional"]),
  tarifaDistribuidoraKwhBrl: numeric("tarifa_distribuidora_kwh_brl", {
    precision: 8,
    scale: 4,
  }),
  tarifaFonte: text("tarifa_fonte"),

  // Snapshots de dados de mercado
  frotaEvMunicipioSnapshot: jsonb("frota_ev_municipio_snapshot"),
  carregadoresProximosSnapshot: jsonb("carregadores_proximos_snapshot"),
  irradiacaoSolarSnapshot: jsonb("irradiacao_solar_snapshot"),

  // Outputs
  cenariosResultados: jsonb("cenarios_resultados"),
  bpPdfPath: text("bp_pdf_path"),
  bpHtmlPath: text("bp_html_path"),

  // Logs de processamento
  jobsLog: jsonb("jobs_log").default([]),
  errorLog: text("error_log"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
