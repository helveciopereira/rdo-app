'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { Building2, ListTodo, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HubPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
        <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              EXPOL <span className="font-light opacity-50 text-sm hidden sm:inline">PRO</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:block">{user?.email}</span>
            <button 
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-slate-700 hover:border-red-900"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col">
          <div className="mb-10 text-center md:text-left mt-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Hub de Aplicativos</h1>
            <p className="text-sm text-slate-400 mt-2">Selecione o módulo que deseja acessar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card: RDO */}
            <button 
              onClick={() => router.push('/dashboard')}
              className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer h-48"
            >
              <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building2 size={32} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">RDO</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Relatório Diário de Obras</p>
            </button>

            {/* Card: ToDo */}
            <button 
              onClick={() => router.push('/todo')}
              className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer h-48"
            >
              <div className="w-16 h-16 bg-emerald-600/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ListTodo size={32} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">ToDo</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Gestão de Atividades</p>
            </button>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
