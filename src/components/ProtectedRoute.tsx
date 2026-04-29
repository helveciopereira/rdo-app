'use client';

// v1.36.1 — ProtectedRoute com renderização otimística
// Se o usuário já autenticou nesta aba, renderiza o conteúdo imediatamente
// em vez de exibir o spinner de "Carregando..." a cada navegação.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  // Timeout de segurança: se loading durar mais de 5s, mostra opção de reload
  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Se ainda está carregando...
  if (loading || !session) {
    // Verifica se o usuário já autenticou nesta aba (cache do AuthContext)
    const wasAuthenticated = typeof window !== 'undefined'
      ? sessionStorage.getItem('auth_session_active') === 'true'
      : false;

    // Se já autenticou, renderiza o conteúdo otimisticamente (sem spinner)
    if (wasAuthenticated && loading) {
      return <>{children}</>;
    }

    // Caso contrário, exibe o spinner (primeiro acesso ou sessão expirada)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold uppercase tracking-widest">Carregando...</p>

          {/* Botão de recuperação caso o loading trave */}
          {showTimeout && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold uppercase tracking-widest border border-slate-700 transition-colors"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
