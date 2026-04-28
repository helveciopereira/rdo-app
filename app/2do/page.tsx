'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeft, CheckCircle, Circle, Clock, ListTodo, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Tarefa {
  id: string;
  user_id: string;
  descricao: string;
  status: 'POR_FAZER' | 'ANDAMENTO' | 'CONCLUIDA' | 'EXCLUIDA';
  created_at: string;
}

export default function Do2Page() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchTarefas();
  }, [user]);

  const fetchTarefas = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .neq('status', 'CONCLUIDA')
        .neq('status', 'EXCLUIDA')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTarefas(data || []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tarefas')
        .insert({
          user_id: user.id,
          descricao: novaTarefa.trim(),
          status: 'POR_FAZER'
        })
        .select()
        .single();

      if (error) throw error;
      setTarefas([data, ...tarefas]);
      setNovaTarefa('');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      alert('Não foi possível adicionar a tarefa.');
    }
  };

  const updateStatus = async (id: string, status: Tarefa['status']) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setTarefas(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tarefas').update({ status: 'EXCLUIDA' }).eq('id', id);
      if (error) throw error;
      setTarefas(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
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
              onClick={() => router.push('/hub')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-slate-700"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Gestão de Atividades</h1>
            <p className="text-sm text-slate-400 mt-1">Gerencie suas tarefas diárias. (Acesso Restrito ao Usuário)</p>
          </div>

          {/* Add Task Form */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-8">
            <input 
              type="text"
              value={novaTarefa}
              onChange={e => setNovaTarefa(e.target.value)}
              placeholder="O que você precisa fazer hoje?"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            />
            <button 
              type="submit"
              disabled={!novaTarefa.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-lg font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Adicionar</span>
            </button>
          </form>

          {/* Tasks List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col">
            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Suas Tarefas</h2>
              <div className="flex gap-2">
                <button onClick={() => router.push('/2do/excluidas')} className="bg-red-900/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-colors">Excluídas</button>
                <button onClick={() => router.push('/2do/concluidas')} className="bg-emerald-900/30 text-emerald-500 border border-emerald-900/50 hover:bg-emerald-900/50 px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-colors">Concluídas</button>
              </div>
            </div>
            
            <div className="p-2 flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando tarefas...</div>
              ) : tarefas.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <ListTodo size={32} className="mb-3 opacity-20" />
                  <p>Nenhuma tarefa pendente.</p>
                  <p className="text-xs mt-1">Crie sua primeira tarefa acima.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {tarefas.map(tarefa => (
                    <li key={tarefa.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${tarefa.status === 'CONCLUIDA' ? 'bg-slate-900/50 border-slate-800/50 opacity-60' : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'}`}>
                      
                      <button 
                        onClick={() => updateStatus(tarefa.id, tarefa.status === 'CONCLUIDA' ? 'POR_FAZER' : 'CONCLUIDA')}
                        className={`mt-0.5 shrink-0 ${tarefa.status === 'CONCLUIDA' ? 'text-emerald-500' : 'text-slate-500 hover:text-emerald-400'}`}
                      >
                        {tarefa.status === 'CONCLUIDA' ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </button>

                      <span className={`flex-1 text-sm ${tarefa.status === 'CONCLUIDA' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {tarefa.descricao}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <select 
                          value={tarefa.status}
                          onChange={(e) => updateStatus(tarefa.id, e.target.value as any)}
                          className={`bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer
                            ${tarefa.status === 'POR_FAZER' ? 'text-slate-400' : ''}
                            ${tarefa.status === 'ANDAMENTO' ? 'text-blue-400 border-blue-900' : ''}
                            ${tarefa.status === 'CONCLUIDA' ? 'text-emerald-500 border-emerald-900/50' : ''}
                          `}
                        >
                          <option value="POR_FAZER">Por Fazer</option>
                          <option value="ANDAMENTO">Andamento</option>
                          <option value="CONCLUIDA">Concluída</option>
                          <option value="EXCLUIDA">Excluída</option>
                        </select>

                        <button 
                          onClick={() => handleDelete(tarefa.id)}
                          className="text-slate-600 hover:text-red-400 p-1"
                        >
                          <Trash2 size={16} />
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
