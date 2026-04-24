// v0.1
import { createClient } from '@supabase/supabase-js'

// Cria e exporta o cliente oficial conectado ao seu banco criado (RDO-Backend)
// As chaves precisam ser salvas em C:\Relatórios\rdo-app\.env.local (para rodar local) 
// ou no Secrets do GitHub (para rodar no GitHub Pages).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tytcdqnuecdauoycpqdg.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dGNkcW51ZWNkYXVveWNwcWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDQ0MTksImV4cCI6MjA5MjYyMDQxOX0.ZU0wlEiOpJjibD1oIlDfft21nzJTonH6z4es5pWhUO4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
