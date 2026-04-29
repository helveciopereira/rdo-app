'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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
        try {
          const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
          setRole(data?.role || 'leitura');
        } catch (err) {
          console.error('Erro ao buscar role:', err);
          setRole('leitura');
        }
      } else {
        setRole('leitura');
      }
      setLoading(false);
    }).catch(err => {
      console.error('Falha crítica ao buscar sessão:', err);
      setLoading(false);
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const { data } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
          setRole(data?.role || 'leitura');
        } catch(err) {
          console.error('Erro onAuthStateChange:', err);
          setRole('leitura');
        }
      } else {
        setRole('leitura');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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
