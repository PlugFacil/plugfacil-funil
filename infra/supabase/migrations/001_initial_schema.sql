-- ============================================================
-- PlugFácil Funil — Schema inicial
-- Aplicar no Supabase via: supabase db push ou SQL Editor
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
create type lead_stage as enum (
  'cold', 'pdf_buyer', 'bp_buyer', 'meeting_scheduled', 'client', 'lost'
);

create type product_kind as enum (
  'pdf_mercado', 'business_plan', 'consultoria'
);

create type purchase_status as enum (
  'pending', 'paid', 'refunded', 'failed'
);

create type bp_status as enum (
  'draft', 'submitted', 'processing', 'review_needed', 'completed', 'failed'
);

-- ============================================================
-- PROFILES (estende auth.users do Supabase)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  cpf_cnpj text,
  city text,
  state text,
  lead_score int default 0,
  lead_stage lead_stage not null default 'cold',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_lgpd_at timestamptz,
  consent_marketing_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "users see own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "service role full access profiles" on public.profiles
  using (auth.role() = 'service_role');

-- ============================================================
-- PURCHASES
-- ============================================================
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete restrict,
  product product_kind not null,
  status purchase_status not null default 'pending',
  amount_cents int not null,
  currency text not null default 'BRL',
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz default now()
);

create index on public.purchases(profile_id, status);
create index on public.purchases(product, status);

alter table public.purchases enable row level security;
create policy "users see own purchases" on public.purchases
  for select using (auth.uid() = profile_id);
create policy "service role full access purchases" on public.purchases
  using (auth.role() = 'service_role');

-- ============================================================
-- BUSINESS PLANS
-- ============================================================
create table public.business_plans (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id),
  profile_id uuid not null references public.profiles(id),
  status bp_status not null default 'draft',

  -- Endereço
  endereco_cep text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_municipio text,
  endereco_uf text,
  endereco_lat double precision,
  endereco_lng double precision,

  tipo_local text check (tipo_local in (
    'condominio_residencial', 'condominio_comercial', 'posto_combustivel',
    'shopping', 'supermercado', 'hotel_pousada', 'estacionamento',
    'concessionaria', 'outros'
  )),

  -- Análise visual da vaga
  foto_vaga_path text,
  vaga_analise jsonb,

  -- Análise elétrica do padrão (com salvaguardas obrigatórias)
  foto_padrao_path text,
  padrao_analise jsonb,
  padrao_input_manual jsonb,

  -- Cenário energético
  cenarios_selecionados text[] default array['convencional']::text[],
  tarifa_distribuidora_kwh_brl numeric(8,4),
  tarifa_fonte text,

  -- Snapshots de dados de mercado (para reprodutibilidade)
  frota_ev_municipio_snapshot jsonb,
  carregadores_proximos_snapshot jsonb,
  irradiacao_solar_snapshot jsonb,

  -- Outputs gerados
  cenarios_resultados jsonb,
  bp_pdf_path text,
  bp_html_path text,

  -- Logs de processamento
  jobs_log jsonb default '[]'::jsonb,
  error_log text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create index on public.business_plans(status);
create index on public.business_plans(profile_id);
create index on public.business_plans(purchase_id);

alter table public.business_plans enable row level security;
create policy "users see own bps" on public.business_plans
  for select using (auth.uid() = profile_id);
create policy "users update own draft bps" on public.business_plans
  for update using (auth.uid() = profile_id and status = 'draft');
create policy "service role full access bps" on public.business_plans
  using (auth.role() = 'service_role');

-- ============================================================
-- LEAD HANDOFFS (para o comercial PlugFácil)
-- ============================================================
create table public.lead_handoffs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  business_plan_id uuid references public.business_plans(id),
  source text not null,
  notes text,
  assigned_to text,
  status text not null default 'new'
    check (status in ('new','contacted','meeting_scheduled','proposal_sent','won','lost')),
  meeting_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on public.lead_handoffs(profile_id, status);

alter table public.lead_handoffs enable row level security;
create policy "service role full access handoffs" on public.lead_handoffs
  using (auth.role() = 'service_role');

-- ============================================================
-- DADOS DE MERCADO
-- ============================================================
create table public.frota_ev_municipio (
  id uuid primary key default gen_random_uuid(),
  uf text not null,
  municipio text not null,
  ano int not null,
  mes int not null,
  bev int default 0,
  phev int default 0,
  hev int default 0,
  fonte text default 'ABVE',
  updated_at timestamptz default now(),
  unique(uf, municipio, ano, mes)
);

create index on public.frota_ev_municipio(uf, municipio);

create table public.tarifas_distribuidora (
  id uuid primary key default gen_random_uuid(),
  distribuidora text not null,
  uf text not null,
  classe text not null,
  tarifa_te_kwh numeric(8,4),
  tarifa_tusd_kwh numeric(8,4),
  bandeira text default 'verde',
  vigencia_inicio date,
  vigencia_fim date,
  fonte_url text,
  updated_at timestamptz default now()
);

create index on public.tarifas_distribuidora(uf, distribuidora);

-- ============================================================
-- EVENTS (analytics interno + auditoria)
-- ============================================================
create table public.events (
  id bigserial primary key,
  profile_id uuid references public.profiles(id),
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  occurred_at timestamptz default now()
);

create index on public.events(profile_id, occurred_at desc);
create index on public.events(event_name, occurred_at desc);

alter table public.events enable row level security;
create policy "service role full access events" on public.events
  using (auth.role() = 'service_role');

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger business_plans_updated_at before update on public.business_plans
  for each row execute procedure public.handle_updated_at();

create trigger lead_handoffs_updated_at before update on public.lead_handoffs
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao criar auth.user
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
