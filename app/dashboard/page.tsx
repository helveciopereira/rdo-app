'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';
import { Plus, FileText, Calendar, Building2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchRelatorios();
  }, []);

  const fetchRelatorios = async () => {
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select(`
          id,
          data_relatorio,
          obras (
            nome,
            empresa
          )
        `)
        .order('data_relatorio', { ascending: false });

      if (error) throw error;
      setRelatorios(data || []);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

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

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Histórico de RDOs</h1>
              <p className="text-sm text-slate-400 mt-1">Gerencie os relatórios diários das suas obras.</p>
            </div>
            <button 
              onClick={() => router.push('/rdo/novo')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 uppercase tracking-widest transition-colors"
            >
              <Plus size={16} /> Novo RDO
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-800/50 rounded-lg border border-slate-800"></div>
              ))}
            </div>
          ) : relatorios.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <FileText size={48} className="text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">Nenhum relatório encontrado</h3>
              <p className="text-sm text-slate-500 mb-6">Você ainda não salvou nenhum Diário de Obra no sistema.</p>
              <button 
                onClick={() => router.push('/rdo/novo')}
                className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-6 py-2 rounded-md text-sm font-bold border border-slate-700 uppercase tracking-widest transition-colors"
              >
                Começar o primeiro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatorios.map((rdo) => (
                <div key={rdo.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-blue-500/50 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-blue-500 transition-colors"></div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-200 text-lg">{rdo.obras?.nome || 'Obra não especificada'}</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{rdo.obras?.empresa || 'Empresa'}</p>
                    </div>
                    <div className="bg-slate-800 p-2 rounded flex flex-col items-center">
                      <Calendar size={14} className="text-blue-400 mb-1" />
                      <span className="text-[10px] font-bold">{formatDate(rdo.data_relatorio)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/50">
                    <button onClick={() => router.push(`/rdo/${rdo.id}`)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors">
                      Visualizar
                    </button>
                    {/* Futuramente, editar relatórios: router.push(`/rdo/editar/${rdo.id}`) */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
