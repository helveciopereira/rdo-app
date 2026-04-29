// v1.36.1 — Cliente Supabase otimizado
// Removido o override global de fetch com cache: 'no-store'
// que impedia o cache HTTP natural do navegador para TODAS as chamadas,
// incluindo as de autenticação (causando lentidão na revalidação de sessão).
// As queries que precisam de dados frescos já usam .abortSignal() individualmente.

import { createClient } from '@supabase/supabase-js'

// Cria e exporta o cliente oficial conectado ao banco Supabase (RDO-Backend)
// As chaves precisam ser salvas em .env.local (local) ou Secrets do GitHub (deploy).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tytcdqnuecdauoycpqdg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dGNkcW51ZWNkYXVveWNwcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDQ0MTksImV4cCI6MjA5MjYyMDQxOX0.ZU0wlEiOpJjibD1oIlDfft21nzJTonH6z4es5pWhUO4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
