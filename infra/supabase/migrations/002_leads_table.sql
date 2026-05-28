-- ============================================================
-- Migration 002 — tabela leads
-- Usada pelo webhook do Stripe para registrar cada compra
-- ============================================================

create table if not exists public.leads (
  id                          uuid primary key default gen_random_uuid(),
  email                       text not null,
  full_name                   text not null default '',
  phone                       text not null default '',
  perfil_declarado            text not null default '',
  produto                     text not null default 'pdf_mercado',
  status                      text not null default 'paid',
  stripe_checkout_session_id  text unique,
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now()
);

-- índices para lookup rápido
create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_status_idx on public.leads (status);

-- RLS: somente service_role acessa (webhook usa admin client)
alter table public.leads enable row level security;

create policy "service_role_all" on public.leads
  for all
  to service_role
  using (true)
  with check (true);
