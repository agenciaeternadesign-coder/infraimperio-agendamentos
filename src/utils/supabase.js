import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Cloud ativo quando as credenciais existem (definidas no .env e no Vercel).
// Com cloud ligado, cada visita criada é gravada no Supabase → dispara a
// automação de WhatsApp (confirmação no ato + lembretes diários).
export const isCloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
export const supabase = isCloudEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
