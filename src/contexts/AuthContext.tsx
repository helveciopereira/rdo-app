'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// v1.36.1 — Cache de autenticação otimizado

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: 'leitura',
  signOut: async () => {},
});

/**
 * Busca o role do usuário no banco, com fallback para cache em sessionStorage.
 * Isso evita uma query extra ao Supabase em cada navegação entre páginas.
 */
const fetchAndCacheRole = async (userId: string): Promise<string> => {
  // 1. Tenta buscar do cache primeiro (navegação rápida)
  const cachedRole = sessionStorage.getItem('user_role');
  const cachedUserId = sessionStorage.getItem('user_role_id');

  // Se o cache é do mesmo usuário, retorna imediatamente
  if (cachedRole && cachedUserId === userId) {
    return cachedRole;
  }

  // 2. Cache expirado ou primeiro acesso — busca no banco
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const role = data?.role || 'leitura';

    // Salva no cache para navegações futuras
    sessionStorage.setItem('user_role', role);
    sessionStorage.setItem('user_role_id', userId);

    return role;
  } catch (err) {
    console.error('Erro ao buscar role:', err);
    return cachedRole || 'leitura'; // Fallback para cache antigo ou padrão
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('leitura');
  const router = useRouter();

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Erro de sessão Supabase:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Marca que o usuário já autenticou nesta aba (para ProtectedRoute otimístico)
        sessionStorage.setItem('auth_session_active', 'true');
        const userRole = await fetchAndCacheRole(session.user.id);
        setRole(userRole);
      } else {
        setRole('leitura');
        // Limpa cache quando não há sessão
        sessionStorage.removeItem('auth_session_active');
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role_id');
      }
      setLoading(false);
    }).catch(err => {
      console.error('Falha crítica ao buscar sessão:', err);
      setLoading(false);
    });

    // Escuta mudanças de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        sessionStorage.setItem('auth_session_active', 'true');
        // Usa cache para evitar query desnecessária em navegações
        const userRole = await fetchAndCacheRole(session.user.id);
        setRole(userRole);
      } else {
        setRole('leitura');
        sessionStorage.removeItem('auth_session_active');
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role_id');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Limpa cache de sessão ao sair
    sessionStorage.removeItem('auth_session_active');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_role_id');
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
