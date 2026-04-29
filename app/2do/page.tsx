'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeft, Check, CheckCircle, Circle, GripVertical, ListTodo, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Tarefa {
  id: string;
  user_id: string;
  descricao: string;
  status: 'POR_FAZER' | 'ANDAMENTO' | 'CONCLUIDA' | 'EXCLUIDA';
  ordem: number;
  created_at: string;
}

export default function Do2Page() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Drag State
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
        .neq('status', 'CONCLUIDA')
        .neq('status', 'EXCLUIDA')
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (error) throw error;
      setTarefas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tarefas:', error);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.trim() || !user) return;

    const novaOrdem = tarefas.length > 0 ? Math.min(...tarefas.map(t => t.ordem || 0)) - 1 : 0;

    try {
      const { data, error } = await supabase
        .from('tarefas')
        .insert({
          user_id: user.id,
          descricao: novaTarefa.trim(),
          status: 'POR_FAZER',
          ordem: novaOrdem
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

  // Funções de Edição
  const startEditing = (tarefa: Tarefa) => {
    setEditingId(tarefa.id);
    setEditingText(tarefa.descricao);
  };

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ descricao: editingText.trim() })
        .eq('id', id);

      if (error) throw error;
      setTarefas(prev => prev.map(t => t.id === id ? { ...t, descricao: editingText.trim() } : t));
    } catch (error) {
      console.error('Erro ao editar tarefa:', error);
    } finally {
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Funções de Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // Necessário para Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const oldIndex = tarefas.findIndex(t => t.id === draggedId);
    const newIndex = tarefas.findIndex(t => t.id === targetId);

    if (oldIndex === -1 || newIndex === -1) return;

    const novasTarefas = [...tarefas];
    const [draggedItem] = novasTarefas.splice(oldIndex, 1);
    novasTarefas.splice(newIndex, 0, draggedItem);
    
    // Atualiza otimisticamente a ordem local
    setTarefas(novasTarefas);
    setDraggedId(null);

    // Salva a nova ordem no banco
    try {
      await Promise.all(
        novasTarefas.map((t, index) => 
          supabase.from('tarefas').update({ ordem: index }).eq('id', t.id)
        )
      );
      // Opcionalmente recarregar os dados para ter as ordens exatas do DB:
      // fetchTarefas();
    } catch (error) {
      console.error('Erro ao salvar reordenação:', error);
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
              onClick={() => window.history.length > 1 ? router.back() : router.push('/hub')}
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
                <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs uppercase tracking-widest font-medium">Carregando tarefas...</span>
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
                  <ListTodo size={32} className="mb-3 opacity-20" />
                  <p>Nenhuma tarefa pendente.</p>
                  <p className="text-xs mt-1">Crie sua primeira tarefa acima.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {tarefas.map(tarefa => (
                    <li 
                      key={tarefa.id} 
                      draggable={editingId !== tarefa.id}
                      onDragStart={(e) => handleDragStart(e, tarefa.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, tarefa.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all 
                        ${draggedId === tarefa.id ? 'opacity-40 border-emerald-500 scale-[0.99]' : 'opacity-100 scale-100'}
                        ${tarefa.status === 'CONCLUIDA' ? 'bg-slate-900/50 border-slate-800/50' : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'}
                      `}
                    >
                      <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-emerald-500 transition-colors p-1" title="Arraste para reordenar">
                        <GripVertical size={18} />
                      </div>

                      <button 
                        onClick={() => updateStatus(tarefa.id, tarefa.status === 'CONCLUIDA' ? 'POR_FAZER' : 'CONCLUIDA')}
                        className={`mt-0.5 shrink-0 transition-colors ${tarefa.status === 'CONCLUIDA' ? 'text-emerald-500' : 'text-slate-500 hover:text-emerald-400'}`}
                      >
                        {tarefa.status === 'CONCLUIDA' ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </button>

                      {editingId === tarefa.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            autoFocus
                            type="text" 
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(tarefa.id)}
                            onBlur={() => saveEdit(tarefa.id)}
                            className="flex-1 bg-slate-950 border border-emerald-500 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                          />
                          <button onClick={cancelEdit} onMouseDown={e => e.preventDefault()} className="text-slate-500 hover:text-red-400 p-1 bg-slate-800 rounded transition-colors"><X size={14}/></button>
                        </div>
                      ) : (
                        <span 
                          onDoubleClick={() => startEditing(tarefa)}
                          className={`flex-1 text-sm cursor-text hover:text-emerald-100 transition-colors ${tarefa.status === 'CONCLUIDA' ? 'line-through text-slate-500 hover:text-slate-400' : 'text-slate-200'}`}
                        >
                          {tarefa.descricao}
                        </span>
                      )}

                      {editingId !== tarefa.id && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => startEditing(tarefa)}
                            className="text-slate-600 hover:text-emerald-400 p-1 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          
                          <select 
                            value={tarefa.status}
                            onChange={(e) => updateStatus(tarefa.id, e.target.value as any)}
                            className={`bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer transition-colors
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
                            className="text-slate-600 hover:text-red-400 p-1 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
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
