'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mb-4">
            <Building2 className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">EXPOL <span className="font-light">PRO</span></h1>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-bold">Relatório Diário de Obras</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded text-sm text-center">
              E-mail ou senha incorretos.
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest py-3 rounded shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Para solicitar acesso, entre em contato com o administrador do sistema.
        </p>
      </div>
    </div>
  );
}
