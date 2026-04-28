'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import { A4Document, ReportState } from '@/src/components/A4Document';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

export default function LotePage() {
  const [reports, setReports] = useState<ReportState[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const idsStr = localStorage.getItem('rdo_batch_print_ids');
    if (!idsStr) {
      alert('Nenhum RDO selecionado para impressão.');
      router.push('/dashboard');
      return;
    }

    try {
      const ids = JSON.parse(idsStr);
      if (Array.isArray(ids) && ids.length > 0) {
        fetchRDOs(ids);
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      router.push('/dashboard');
    }
  }, [router]);

  const fetchRDOs = async (ids: string[]) => {
    try {
      const { data, error } = await supabase
        .from('relatorios')
        .select(`
          *,
          obras (nome, empresa, responsavel_tecnico, crea),
          efetivos_obra (*),
          servicos_executados (*),
          registros_fotograficos (*)
        `)
        .in('id', ids)
        .order('data_relatorio', { ascending: true }); // Mais antigo para o mais recente

      if (error) throw error;

      if (data) {
        const formattedReports: ReportState[] = data.map((relatorio: any) => ({
          obra: relatorio.obras?.nome || '',
          empresa: relatorio.obras?.empresa || '',
          data: relatorio.data_relatorio,
          responsavel: relatorio.obras?.responsavel_tecnico || '',
          crea: relatorio.obras?.crea || '',
          logoUrl: '/pollux-logo.png',
          climaManha: relatorio.clima_manha,
          climaTarde: relatorio.clima_tarde,
          efetivo: relatorio.efetivos_obra.map((e: any) => ({ id: e.id, role: e.funcao, quantidade: e.quantidade })),
          servicos: relatorio.servicos_executados.map((s: any) => ({ id: s.id, categoria: s.categoria || '', description: s.descricao, local: s.local, status: s.status })),
          ocorrencias: relatorio.ocorrencias_observacoes || '',
          fotos: relatorio.registros_fotograficos.map((f: any) => ({ id: f.id, url: f.imagem_url, caption: f.legenda }))
        }));

        setReports(formattedReports);
        
        // Aguarda as imagens carregarem antes de acionar a impressão
        setTimeout(() => {
          window.print();
        }, 2000);
      }
    } catch (err) {
      console.error('Erro ao buscar RDOs em lote:', err);
      alert('Erro ao carregar os relatórios.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <p className="font-bold tracking-widest uppercase text-sm">Carregando lote de RDOs...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#10131c] relative flex flex-col pb-32">
        {/* Floating Actions (Hidden in Print) */}
        <div className="fixed top-4 left-0 right-0 flex justify-center gap-4 z-50 print:hidden pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-lg border border-slate-700 shadow-2xl">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold uppercase tracking-widest transition-colors text-white"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold uppercase tracking-widest transition-colors shadow-lg shadow-blue-900/20 text-white"
            >
              <Printer size={16} /> Imprimir Lote
            </button>
          </div>
        </div>

        {/* Renderização Sequencial dos RDOs */}
        <div className="w-full flex flex-col items-center pt-24 print:pt-0 gap-16 print:gap-0">
          {reports.map((report, index) => (
            <div key={index} className="w-full max-w-[210mm] print:max-w-full origin-top transition-transform duration-300 scale-[0.55] sm:scale-[0.75] md:scale-[0.80] lg:scale-[0.85] xl:scale-100 print:scale-100 shrink-0 shadow-2xl print:shadow-none">
              <A4Document data={report} />
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
