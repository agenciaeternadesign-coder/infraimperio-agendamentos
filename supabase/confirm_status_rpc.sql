-- RPCs para o fluxo de RESPOSTAS do cliente (Fase 4) atualizarem o estado de
-- confirmação dentro do jsonb `data` da tabela `visits`, em tempo real.
-- Correr no SQL Editor do Supabase quando se ligar o inbound (Twilio → Make → Supabase).
--
-- Como o Make chama (com a service key):
--   POST {SUPABASE_URL}/rest/v1/rpc/confirm_by_phone
--   headers: apikey + Authorization: Bearer <service_key>
--   body: { "p_phone": "351912345678", "p_status": "confirmado" }
--   (mapear botão → estado: confirmar→confirmado, remarcar→remarcado, cancelar→cancelado)

-- 1) Por id da visita (quando se conhece o agendamento exato)
create or replace function set_confirm_status(p_id text, p_status text)
returns void as $$
begin
  update public.visits
     set data = jsonb_set(data, '{confirmStatus}', to_jsonb(p_status)),
         updated_at = now()
   where id = p_id;
end;
$$ language plpgsql security definer;

-- 2) Por telemóvel (para respostas do cliente — só se tem o número).
--    Atualiza a visita PENDENTE mais próxima (de hoje em diante) desse telemóvel.
--    Normaliza para dígitos para casar formatos diferentes (+351 / 351 / espaços).
--    Devolve o id da visita atualizada (ou NULL se não encontrou).
create or replace function confirm_by_phone(p_phone text, p_status text)
returns text as $$
declare
  v_id text;
begin
  select id into v_id
    from public.visits
   where regexp_replace(coalesce(data->>'clientPhone',''), '\D', '', 'g')
         like '%' || regexp_replace(p_phone, '\D', '', 'g')
     and coalesce(data->>'confirmStatus', 'pendente') = 'pendente'
     and (data->>'date')::date >= current_date
   order by (data->>'date')::date asc, coalesce(data->>'time', '99:99') asc
   limit 1;

  if v_id is not null then
    update public.visits
       set data = jsonb_set(data, '{confirmStatus}', to_jsonb(p_status)),
           updated_at = now()
     where id = v_id;
  end if;
  return v_id;
end;
$$ language plpgsql security definer;
