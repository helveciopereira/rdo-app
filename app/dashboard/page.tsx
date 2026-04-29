'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';
import { Plus, FileText, Calendar, Building2, LogOut, Trash2, History, X, ArrowLeft, Printer, CheckSquare, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorState, setErrorState] = useState<string | null>(null);
  const { signOut, user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchRelatorios();
  }, []);

  const fetchRelatorios = async () => {
    setLoading(true);
    setErrorState(null);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout de conexão')), 15000)
    );

    try {
      const fetchPromise = supabase
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

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (result.error) throw result.error;
      setRelatorios(result.data || []);
    } catch (error: any) {
      console.error('Erro ao buscar relatórios:', error);
      setErrorState(error.message === 'Timeout de conexão' ? 'A conexão demorou muito para responder. Tente novamente.' : 'Falha ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getMonthYear = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m] = dateStr.split('-');
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${months[parseInt(m) - 1]}/${y}`;
  };

  const availableMonths = Array.from(new Set(relatorios.map(r => getMonthYear(r.data_relatorio))));

  const handleSelectMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthYear = e.target.value;
    if (!monthYear) {
      setSelectedIds([]);
      return;
    }
    const idsInMonth = relatorios.filter(r => getMonthYear(r.data_relatorio) === monthYear).map(r => r.id);
    setSelectedIds(idsInMonth);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleGerarLote = () => {
    if (selectedIds.length === 0) return;
    localStorage.setItem('rdo_batch_print_ids', JSON.stringify(selectedIds));
    router.push('/rdo/lote');
  };

  const handleDelete = async (id: string) => {
    if (role !== 'master') return;
    if (!confirm('Tem certeza que deseja apagar este RDO? Esta ação não pode ser desfeita.')) return;
    try {
      const { error } = await supabase.from('relatorios').delete().eq('id', id);
      if (error) throw error;
      
      await supabase.from('event_logs').insert({
        user_id: user?.id,
        acao: 'DELETE_RDO',
        detalhes: { rdo_id: id }
      });
      
      setRelatorios(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      alert('Erro ao apagar RDO.');
    }
  };

  const fetchLogs = async () => {
    if (role !== 'master') return;
    try {
      const { data, error } = await supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs(data || []);
      setShowLogs(true);
    } catch(err) {
      console.error(err);
    }
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
              onClick={() => router.push('/hub')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold uppercase tracking-widest transition-colors border border-slate-700"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Histórico de RDOs</h1>
              <p className="text-sm text-slate-400 mt-1">Gerencie os relatórios diários das suas obras.</p>
            </div>
            <div className="flex gap-2">
              {availableMonths.length > 0 && (
                <select 
                  onChange={handleSelectMonth}
                  className="bg-slate-800 text-slate-300 px-3 py-2 rounded-md text-sm border border-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecionar Mês...</option>
                  {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleGerarLote}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <Printer size={16} /> Lote ({selectedIds.length})
                </button>
              )}
              {role === 'master' && (
                <button 
                  onClick={fetchLogs}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-widest transition-colors border border-slate-700"
                >
                  <History size={16} /> Logs
                </button>
              )}
              {role !== 'leitura' && (
                <button 
                  onClick={() => router.push('/rdo/novo')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <Plus size={16} /> Novo RDO
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-800/50 rounded-lg border border-slate-800"></div>
              ))}
            </div>
          ) : errorState ? (
            <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold text-red-400 mb-2">Ops, algo deu errado.</h3>
              <p className="text-sm text-slate-400 mb-6">{errorState}</p>
              <button 
                onClick={fetchRelatorios}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-md text-sm font-bold border border-slate-700 uppercase tracking-widest transition-colors"
              >
                Tentar Novamente
              </button>
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
                <div key={rdo.id} className={`bg-slate-900 border ${selectedIds.includes(rdo.id) ? 'border-emerald-500' : 'border-slate-800 hover:border-blue-500/50'} rounded-lg p-5 transition-colors group relative overflow-hidden cursor-pointer`} onClick={() => toggleSelection(rdo.id)}>
                  <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${selectedIds.includes(rdo.id) ? 'bg-emerald-500' : 'bg-slate-800 group-hover:bg-blue-500'}`}></div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <div className="mt-1" onClick={(e) => { e.stopPropagation(); toggleSelection(rdo.id); }}>
                        {selectedIds.includes(rdo.id) ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-500 group-hover:text-slate-400" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 text-lg">{rdo.obras?.nome || 'Obra não especificada'}</h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{rdo.obras?.empresa || 'Empresa'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded flex flex-col items-center shrink-0">
                      <Calendar size={14} className="text-blue-400 mb-1" />
                      <span className="text-[10px] font-bold">{formatDate(rdo.data_relatorio)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/50" onClick={e => e.stopPropagation()}>
                    <button onClick={() => router.push(`/rdo/novo?id=${rdo.id}`)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors">
                      Visualizar
                    </button>
                    {role === 'master' && (
                      <button onClick={() => handleDelete(rdo.id)} className="bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-400 py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-widest transition-colors border-l border-slate-700">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal de Logs */}
        {showLogs && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center p-6 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-blue-500" />
                  Registro de Eventos (Auditoria)
                </h2>
                <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center">Nenhum evento registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {logs.map(log => (
                      <div key={log.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-blue-400 text-sm">{log.acao}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          User ID: {log.user_id}
                        </p>
                        <pre className="text-[10px] text-slate-500 mt-2 bg-slate-950 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.detalhes, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
