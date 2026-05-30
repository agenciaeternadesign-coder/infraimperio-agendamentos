-- ============================================================
-- Multi-tenant SaaS schema for infraimperio-agendamentos
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── empresas ──────────────────────────────────────────────
create table if not exists public.empresas (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references auth.users(id) on delete cascade not null,
  nome        text not null,
  email       text,
  telefone    text,
  street      text,
  number      text,
  city        text,
  postal_code text,
  created_at  timestamptz default now()
);

alter table public.empresas enable row level security;

create policy "owner can manage their empresa"
  on public.empresas
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ── funcionarios ──────────────────────────────────────────
create table if not exists public.funcionarios (
  id         uuid primary key default uuid_generate_v4(),
  empresa_id uuid references public.empresas(id) on delete cascade not null,
  nome       text not null,
  email      text,
  telefone   text,
  cargo      text,
  ativo      boolean default true,
  created_at timestamptz default now()
);

alter table public.funcionarios enable row level security;

create policy "empresa members can manage funcionarios"
  on public.funcionarios
  for all
  using (
    empresa_id in (
      select id from public.empresas where owner_id = auth.uid()
    )
  )
  with check (
    empresa_id in (
      select id from public.empresas where owner_id = auth.uid()
    )
  );

-- ── folhas (payroll/sheets) ───────────────────────────────
create table if not exists public.folhas (
  id           uuid primary key default uuid_generate_v4(),
  empresa_id   uuid references public.empresas(id) on delete cascade not null,
  funcionario_id uuid references public.funcionarios(id) on delete cascade,
  mes          text not null, -- e.g. "2026-05"
  valor_base   numeric(10, 2) default 0,
  descontos    numeric(10, 2) default 0,
  valor_liquido numeric(10, 2) default 0,
  estado       text default 'pendente', -- pendente | pago
  observacoes  text,
  created_at   timestamptz default now()
);

alter table public.folhas enable row level security;

create policy "empresa members can manage folhas"
  on public.folhas
  for all
  using (
    empresa_id in (
      select id from public.empresas where owner_id = auth.uid()
    )
  )
  with check (
    empresa_id in (
      select id from public.empresas where owner_id = auth.uid()
    )
  );
