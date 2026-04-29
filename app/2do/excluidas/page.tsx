'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeft, ListTodo, Trash2, Undo2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Tarefa {
  id: string;
  user_id: string;
  descricao: string;
  status: 'POR_FAZER' | 'ANDAMENTO' | 'CONCLUIDA' | 'EXCLUIDA';
  created_at: string;
}

export default function Do2ExcluidasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) fetchTarefas();
  }, [user?.id]);

  const fetchTarefas = async () => {
    if (!user) return;
    setLoading(true);
    setErrorState(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .eq('status', 'EXCLUIDA')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (error) throw error;
      setTarefas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tarefas excluídas:', error);
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        setErrorState('A conexão demorou muito para responder. Tente novamente.');
      } else {
        setErrorState('Falha ao comunicar com o servidor.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Tarefa['status']) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setTarefas(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao restaurar tarefa:', error);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar permanentemente esta tarefa?')) return;
    try {
      const { error } = await supabase.from('tarefas').delete().eq('id', id);
      if (error) throw error;
      setTarefas(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao excluir definitivamente a tarefa:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
        
        {/* Navigation */}
        <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <ListTodo size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              EXPOL <span className="font-light opacity-50 text-sm hidden sm:inline">PRO</span>
            </span>
            <span className="bg-slate-800 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ml-2 border border-slate-700">2Do</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.length > 1 ? router.back() : router.push('/2do')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-slate-700"
            >
              <ArrowLeft size={14} /> Voltar ao 2Do
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trash2 className="text-red-500" /> Lixeira
            </h1>
            <p className="text-sm text-slate-400 mt-1">Tarefas que foram marcadas como excluídas.</p>
          </div>

          {/* Tasks List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col">
            <div className="p-2 flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs uppercase tracking-widest font-medium">Carregando lixeira...</span>
                </div>
              ) : errorState ? (
                <div className="p-12 text-center flex flex-col items-center gap-4">
                  <div className="p-3 bg-red-900/20 rounded-full text-red-500">
                    <X size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-400">Ops, algo deu errado.</p>
                    <p className="text-xs text-slate-500">{errorState}</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-bold border border-slate-700 uppercase tracking-widest transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : tarefas.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <Trash2 size={32} className="mb-3 opacity-20 text-red-500" />
                  <p>A lixeira está vazia.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {tarefas.map(tarefa => (
                    <li key={tarefa.id} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-900/50 border-red-900/30 opacity-80 transition-all hover:opacity-100">
                      
                      <Trash2 size={20} className="text-red-500/50 shrink-0" />

                      <span className="flex-1 text-sm text-slate-500 line-through">
                        {tarefa.descricao}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => updateStatus(tarefa.id, 'POR_FAZER')}
                          className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-blue-400 p-2"
                          title="Restaurar tarefa"
                        >
                          <Undo2 size={14} /> Restaurar
                        </button>

                        <button 
                          onClick={() => handleHardDelete(tarefa.id)}
                          className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-400 bg-red-950/50 px-2 py-1 rounded"
                          title="Excluir Permanentemente"
                        >
                          Apagar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
