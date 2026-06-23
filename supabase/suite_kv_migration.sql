-- Tabela chave-valor para sincronizar os dados do suite.html entre computadores
-- Executar no Supabase Dashboard → SQL Editor

create table if not exists suite_kv (
  key        text        primary key,
  value      text        not null,
  updated_at timestamptz default now()
);

alter table suite_kv enable row level security;

-- Política aberta (acesso pela anon key — dados internos da empresa)
drop policy if exists "suite_kv_all" on suite_kv;
create policy "suite_kv_all" on suite_kv
  for all using (true) with check (true);
