'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Plus,
  X,
  Upload,
  Camera,
  FileText,
  Printer,
  Building2,
  HardHat,
  Wrench,
  AlertTriangle,
  ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import ProtectedRoute from '@/src/components/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';

const resizeImageClientSide = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob conversion failed'));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = (err) => reject(err);
  });
};

/* ================= TYPES ================= */

type WeatherCondition = 'sunny' | 'cloudy' | 'rainy';

interface Workforce {
  id: string;
  role: string;
  quantidade: number;
}

interface Service {
  id: string;
  categoria?: string;
  description: string;
  local: string;
  status: 'INICIADO' | 'EM ANDAMENTO' | 'CONCLUÍDO';
}

interface PhotoRecord {
  id: string;
  url: string;
  caption: string;
}

interface ReportState {
  obra: string;
  empresa: string;
  data: string;
  responsavel: string;
  crea: string;
  logoUrl: string | null;
  climaManha: WeatherCondition | null;
  climaTarde: WeatherCondition | null;
  efetivo: Workforce[];
  servicos: Service[];
  ocorrencias: string;
  fotos: PhotoRecord[];
}

/* ================= CONSTANTS & DEFAULTS ================= */

const INITIAL_STATE: ReportState = {
  obra: 'Centro de Eventos - UEMA',
  empresa: 'Pollux Construções Ltda',
  data: new Date().toISOString().split('T')[0],
  responsavel: 'Eng. Licínio Crasso Ramos Correa Junior',
  crea: '0614520720',
  logoUrl: '/pollux-logo.png',
  climaManha: 'sunny',
  climaTarde: 'cloudy',
  efetivo: [
    { id: '1', role: 'Engenheiro', quantidade: 1 },
    { id: '2', role: 'Pedreiro', quantidade: 4 },
    { id: '3', role: 'Ajudante', quantidade: 12 },
  ],
  servicos: [],
  ocorrencias: '',
  fotos: [],
};

const STATUS_COLORS = {
  'INICIADO': 'text-blue-600',
  'EM ANDAMENTO': 'text-amber-500',
  'CONCLUÍDO': 'text-green-600',
};

/* ================= HELPERS ================= */

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const getBasePath = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/rdo-app')) {
    return '/rdo-app';
  }
  return '';
};

/* ================= A4 PAGE COMPONENT ================= */

const A4Page = ({ data, showMain, fotos, pageNum, totalPages }: { data: ReportState, showMain: boolean, fotos: PhotoRecord[], pageNum: number, totalPages: number }) => {
  const totalEfetivo = data.efetivo.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);

  const getCondText = (cond: WeatherCondition | null) => {
    if (cond === 'sunny') return '☀️ Ensolarado';
    if (cond === 'cloudy') return '⛅ Nublado';
    if (cond === 'rainy') return '🌧️ Chuvoso';
    return 'Não informado';
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto flex flex-col p-10 ring-1 ring-black/10 origin-top print:shadow-none print:w-full print:h-[auto] print:m-0 print:p-[5mm] print:ring-0 text-[11px] leading-relaxed relative print:break-after-page page-break-after-always shrink-0 bg-white">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-300 text-[8px] font-mono tracking-widest print:hidden">VISUALIZAÇÃO A4 - PÁGINA {pageNum}</div>

      {/* Header */}
      <header className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between mt-4 shrink-0">
        <div className="flex gap-4 items-center">
          {data.logoUrl ? (
            <img src={data.logoUrl.startsWith('/') ? `${getBasePath()}${data.logoUrl}` : data.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-14 h-14 bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">LOGO</div>
          )}
          <div>
            <h3 className="text-xl font-black leading-tight uppercase font-heading text-slate-900">Diário de Obra</h3>
            <p className="text-[11px] text-slate-600 font-bold tracking-tight">{data.empresa}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-[10px] font-bold bg-slate-100 px-3 py-1 mb-2 border border-slate-200 tracking-widest text-slate-700">v1.22</div>
          <p className="text-[10px] uppercase font-bold text-slate-800">Data: {formatDate(data.data)}</p>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Clima: M: {getCondText(data.climaManha)} / T: {getCondText(data.climaTarde)}</p>
        </div>
      </header>

      {/* Info Blocks */}
      <section className="flex-1 flex flex-col">
        {showMain && (
          <>
            <div className="mb-8 shrink-0">
              <h4 className="text-[11px] font-black border-b border-slate-200 mb-2 pb-1 uppercase tracking-widest">Obra: {data.obra || 'Não informado'}</h4>
              <p className="text-[10px] leading-relaxed text-slate-600 italic">Resp. Técnico: {data.responsavel} {data.crea ? `- CREA: ${data.crea}` : ''}</p>
            </div>

            {/* 1. Serviços */}
            <div className="mb-8 shrink-0 relative">
              <h4 className="text-[10px] font-black border-l-4 border-slate-900 pl-2 mb-3 uppercase tracking-widest">Serviços Executados / Em Andamento</h4>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-[9px] uppercase text-slate-500">
                    <th className="pb-1 w-8 text-center font-bold">#</th>
                    <th className="pb-1 w-1/3 font-bold">Descrição do Serviço</th>
                    <th className="pb-1 w-1/4 font-bold">Categoria</th>
                    <th className="pb-1 w-1/5 font-bold">Local</th>
                    <th className="pb-1 w-20 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {data.servicos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-2 text-slate-400 italic">Nenhum serviço registrado.</td>
                    </tr>
                  )}
                  {data.servicos.map((srv, idx) => (
                    <tr key={srv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-1.5 font-mono text-center text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="py-1.5 font-medium">{srv.description}</td>
                      <td className="py-1.5 text-slate-600 text-[9px]">{srv.categoria || '—'}</td>
                      <td className="py-1.5 text-slate-600">{srv.local}</td>
                      <td className="py-1.5 text-center">
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${STATUS_COLORS[srv.status]}`}>
                          {srv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. Efetivo */}
            <div className="mb-8 shrink-0 relative">
              <h4 className="text-[10px] font-black border-l-4 border-slate-900 pl-2 mb-3 uppercase tracking-widest">Efetivo da Obra</h4>
              <div className="w-full border-t border-b border-slate-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                      <th className="py-1 px-2 font-bold w-3/4">Função</th>
                      <th className="py-1 px-2 text-center font-bold bg-slate-100">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px]">
                    {data.efetivo.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-2 px-2 text-center text-slate-400 italic">Nenhum efetivo listado.</td>
                      </tr>
                    )}
                    {data.efetivo.map((ef) => (
                      <tr key={ef.id} className="border-b border-slate-100">
                        <td className="py-1 px-2">{ef.role || '—'}</td>
                        <td className="py-1 px-2 text-center font-mono font-bold bg-slate-50">
                          {ef.quantidade || 0}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t-2 border-slate-300">
                      <td className="py-1.5 px-2 text-right uppercase text-[9px] text-slate-800 tracking-widest">Total Geral</td>
                      <td className="py-1.5 px-2 text-center font-mono bg-slate-100">{totalEfetivo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Ocorrências */}
            <div className="mb-8 shrink-0 relative">
              <h4 className="text-[10px] font-black border-l-4 border-slate-900 pl-2 mb-3 uppercase tracking-widest">Ocorrências</h4>
              <div className="bg-slate-50 border border-slate-200 p-3 text-[10px] min-h-[60px] text-slate-700 italic">
                {data.ocorrencias ? data.ocorrencias : 'Nenhuma ocorrência grave registrada neste período.'}
              </div>
            </div>
          </>
        )}

        {/* 4. Fotos */}
        {fotos.length > 0 && (
          <div className="mb-6 shrink-0 relative">
            <h4 className="text-[10px] font-black border-l-4 border-slate-900 pl-2 mb-3 uppercase tracking-widest">
              Relatório Fotográfico {!showMain && <span className="text-slate-400 font-semibold">(Continuação)</span>}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {fotos.map((foto, i) => (
                <div key={foto.id} className="border-2 border-slate-100 p-2 bg-white flex flex-col items-center">
                  <img src={foto.url} alt={`Foto ${i + 1}`} className="w-full h-[180px] object-cover grayscale-[20%] border border-slate-200 mb-2" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    {foto.caption || 'SETORES DIVERSOS'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-300 pt-8 mt-auto flex justify-between shrink-0 relative pb-2">
        <div className="w-48 border-t border-slate-400 pt-2 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-800">Responsável Técnico</p>
          <p className="text-[7px] text-slate-500 uppercase mt-1">{data.responsavel}</p>
        </div>
        <div className="w-48 border-t border-slate-400 pt-2 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-800">Assinatura Cliente / Fiscal</p>
          <p className="text-[7px] text-slate-500 uppercase mt-1">Conferido</p>
        </div>
        <div className="absolute right-0 bottom-0 text-[8px] font-bold text-slate-400">
          PÁGINA {pageNum}/{totalPages}
        </div>
      </footer>
    </div>
  );
};

/* ================= A4 DOCUMENT CONTAINER ================= */

const A4Document = ({ data }: { data: ReportState }) => {
  const MAX_PHOTOS_PAGE_1 = 2; // Maximum photos on first page
  const MAX_PHOTOS_PAGE_N = 6; // Maximum photos on subsequent pages

  const firstPageFotos = data.fotos.slice(0, MAX_PHOTOS_PAGE_1);
  const remainingFotos = data.fotos.slice(MAX_PHOTOS_PAGE_1);

  const remainingPhotoChunks = [];
  for (let i = 0; i < remainingFotos.length; i += MAX_PHOTOS_PAGE_N) {
    remainingPhotoChunks.push(remainingFotos.slice(i, i + MAX_PHOTOS_PAGE_N));
  }

  const totalPages = 1 + remainingPhotoChunks.length;

  return (
    <div className="flex flex-col gap-8 print:gap-0 print:block w-full items-center">
      <A4Page data={data} showMain={true} fotos={firstPageFotos} pageNum={1} totalPages={totalPages} />
      {remainingPhotoChunks.map((chunk, idx) => (
        <A4Page key={idx} data={data} showMain={false} fotos={chunk} pageNum={idx + 2} totalPages={totalPages} />
      ))}
    </div>
  );
};

/* ================= MAIN APP ================= */

function DailyReportApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const rdoId = searchParams.get('id');
  const isEditing = !!rdoId;

  const [report, setReport] = useState<ReportState>(INITIAL_STATE);
  const [viewMode, setViewMode] = useState<'form' | 'preview'>(isEditing ? 'preview' : 'form');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchRDO(rdoId);
    } else {
      const draft = localStorage.getItem('rdo_draft');
      if (draft) {
        if (confirm('Você possui um rascunho salvo não finalizado. Deseja restaurar os dados?')) {
          try {
            setReport(JSON.parse(draft));
            setIsLoaded(true);
            return;
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        } else {
          localStorage.removeItem('rdo_draft');
        }
      }
      
      // Se não for edição e não houver rascunho (ou for rejeitado), busca o último RDO
      fetchLastRDO();
    }
  }, [rdoId, isEditing]);

  const fetchLastRDO = async () => {
    try {
      const { data: lastRdo, error } = await supabase
        .from('relatorios')
        .select(`
          *,
          obras (nome, empresa, responsavel_tecnico, crea),
          efetivos_obra (*),
          servicos_executados (*)
        `)
        .order('data_relatorio', { ascending: false })
        .limit(1)
        .single();

      if (lastRdo && !error) {
        setReport(prev => ({
          ...prev,
          obra: lastRdo.obras?.nome || prev.obra,
          empresa: lastRdo.obras?.empresa || prev.empresa,
          responsavel: lastRdo.obras?.responsavel_tecnico || prev.responsavel,
          crea: lastRdo.obras?.crea || prev.crea,
          efetivo: lastRdo.efetivos_obra?.map((e: any) => ({
            id: generateId(),
            role: e.funcao,
            quantidade: e.quantidade
          })) || prev.efetivo,
          servicos: lastRdo.servicos_executados
            ?.filter((s: any) => s.status !== 'CONCLUÍDO') // Remove os concluídos
            .map((s: any) => ({
              id: generateId(),
              description: s.descricao,
              local: s.local,
              status: s.status === 'INICIADO' ? 'EM ANDAMENTO' : s.status
            })) || prev.servicos,
        }));
      }
    } catch (err) {
      console.error("Nenhum RDO anterior ou erro ao buscar:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  const fetchRDO = async (id: string) => {
    try {
      const { data: relatorio, error } = await supabase
        .from('relatorios')
        .select(`
          *,
          obras (nome, empresa, responsavel_tecnico, crea),
          efetivos_obra (*),
          servicos_executados (*),
          registros_fotograficos (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (relatorio) {
        setReport({
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
        });
      }
    } catch (err) {
      console.error("Erro ao buscar RDO:", err);
      alert('Não foi possível carregar este relatório.');
    } finally {
      setIsLoaded(true);
    }
  };



  useEffect(() => {
    if (isLoaded && !isEditing) {
      localStorage.setItem('rdo_draft', JSON.stringify(report));
    }
  }, [report, isLoaded, isEditing]);

  const handleChange = (field: keyof ReportState, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const addEfetivo = () => setReport(prev => ({ ...prev, efetivo: [...prev.efetivo, { id: generateId(), role: '', quantidade: 0 }] }));
  const updateEfetivo = (id: string, field: keyof Workforce, value: any) => setReport(prev => ({ ...prev, efetivo: prev.efetivo.map(e => e.id === id ? { ...e, [field]: value } : e) }));
  const removeEfetivo = (id: string) => setReport(prev => ({ ...prev, efetivo: prev.efetivo.filter(e => e.id !== id) }));

  const addServico = () => setReport(prev => ({ ...prev, servicos: [...prev.servicos, { id: generateId(), categoria: '', description: '', local: '', status: 'INICIADO' }] }));
  const updateServico = (id: string, field: keyof Service, value: any) => setReport(prev => ({ ...prev, servicos: prev.servicos.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  const removeServico = (id: string) => setReport(prev => ({ ...prev, servicos: prev.servicos.filter(s => s.id !== id) }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'foto') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (type === 'logo') {
      const url = URL.createObjectURL(file);
      handleChange('logoUrl', url);
      e.target.value = '';
      return;
    }

    try {
      const resizedBlob = await resizeImageClientSide(file, 1280, 720);
      const tempUrl = URL.createObjectURL(resizedBlob);
      const tempId = generateId();
      
      setReport(prev => ({ ...prev, fotos: [...prev.fotos, { id: tempId, url: tempUrl, caption: 'Enviando...' }] }));

      const fileName = `${Date.now()}_${generateId()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, resizedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(fileName);

      setReport(prev => ({
        ...prev,
        fotos: prev.fotos.map(f => f.id === tempId ? { ...f, url: publicUrl, caption: '' } : f)
      }));

    } catch (error) {
      console.error("Erro no upload da imagem", error);
      alert('Erro ao enviar imagem. Verifique se o bucket "fotos" foi criado como Público.');
    } finally {
      e.target.value = '';
    }
  };
  const removeFoto = (id: string) => setReport(prev => ({ ...prev, fotos: prev.fotos.filter(f => f.id !== id) }));
  const updateFotoCaption = (id: string, caption: string) => setReport(prev => ({ ...prev, fotos: prev.fotos.map(f => f.id === id ? { ...f, caption } : f) }));

  const handlePrint = () => window.print();

  const saveTemplate = () => {
    const template = {
      obra: report.obra,
      empresa: report.empresa,
      responsavel: report.responsavel,
      crea: report.crea,
      efetivoRoles: report.efetivo.map(e => e.role),
    };
    localStorage.setItem('construmanage_template', JSON.stringify(template));
    alert('Predefinições salvas com sucesso!');
  };

  const loadTemplate = () => {
    const saved = localStorage.getItem('construmanage_template');
    if (saved) {
      const template = JSON.parse(saved);
      setReport(prev => ({
        ...prev,
        obra: template.obra || '',
        empresa: template.empresa || '',
        responsavel: template.responsavel || '',
        crea: template.crea || '',
        efetivo: (template.efetivoRoles || []).map((role: string) => ({
          id: generateId(),
          role,
          quantidade: 0,
        })),
        servicos: [],
        ocorrencias: '',
        fotos: [],
      }));
    } else {
      alert('Nenhuma predefinição encontrada. Preencha os dados e clique em "Salvar Modelo".');
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToDatabase = async () => {
    try {
      setIsSaving(true);

      let obraId = null;
      if (report.obra) {
        const { data: obraData, error: obraError } = await supabase
          .from('obras')
          .insert({
            nome: report.obra,
            empresa: report.empresa,
            responsavel_tecnico: report.responsavel,
            crea: report.crea
          })
          .select()
          .single();

        if (obraError) {
          console.error("Erro ao inserir obra:", obraError);
        } else {
          obraId = obraData.id;
        }
      }

      const { data: relatorioData, error: relatorioError } = await supabase
        .from('relatorios')
        .insert({
          obra_id: obraId,
          data_relatorio: report.data,
          clima_manha: report.climaManha,
          clima_tarde: report.climaTarde,
          ocorrencias_observacoes: report.ocorrencias
        })
        .select()
        .single();

      if (relatorioError) throw relatorioError;

      const relatorioId = relatorioData.id;

      if (report.efetivo.length > 0) {
        const efetivosToInsert = report.efetivo.map(ef => ({
          relatorio_id: relatorioId,
          funcao: ef.role,
          quantidade: ef.quantidade
        }));

        const { error: efetivoError } = await supabase
          .from('efetivos_obra')
          .insert(efetivosToInsert);

        if (efetivoError) throw efetivoError;
      }

      if (report.servicos.length > 0) {
        const servicosToInsert = report.servicos.map(srv => ({
          relatorio_id: relatorioId,
          categoria: srv.categoria || null,
          descricao: srv.description,
          local: srv.local,
          status: srv.status
        }));

        const { error: servicoError } = await supabase
          .from('servicos_executados')
          .insert(servicosToInsert);

        if (servicoError) throw servicoError;
      }

      if (report.fotos.length > 0) {
        const fotosToInsert = report.fotos.map(foto => ({
          relatorio_id: relatorioId,
          imagem_url: foto.url,
          legenda: foto.caption
        }));

        const { error: fotoError } = await supabase
          .from('registros_fotograficos')
          .insert(fotosToInsert);

        if (fotoError) throw fotoError;
      }

      // Log event
      await supabase.from('event_logs').insert({
        user_id: user?.id,
        acao: isEditing ? 'EDIT_RDO' : 'CREATE_RDO',
        detalhes: { obra: report.obra, rdo_id: relatorioId }
      });

      alert('Relatório salvo no Supabase com sucesso!');
      localStorage.removeItem('rdo_draft');
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar no banco de dados: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="no-print h-screen flex flex-col overflow-hidden bg-slate-950 font-sans text-slate-200">

        {/* Header Navigation (Editorial Aesthetic) */}
        <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white"></div>
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              EXPOL <span className="font-light opacity-50 text-sm hidden sm:inline">PRO</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors border border-slate-700 text-slate-300 mr-2 flex items-center gap-1">
              <ArrowLeft size={14} /> Voltar
            </button>
            {role !== 'leitura' && (
              <>
                <button onClick={saveTemplate} className="hidden lg:block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors border border-slate-700 text-slate-300">
                  Salvar Modelo
                </button>
                <button onClick={loadTemplate} className="hidden lg:block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors border border-slate-700 text-slate-300 mr-2">
                  Carregar Modelo
                </button>
                <button className="hidden sm:block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors border border-slate-700">
                  Configurações
                </button>
                <button onClick={handleSaveToDatabase} disabled={isSaving || isEditing} className="hidden sm:block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors text-white mr-2 disabled:opacity-50">
                  {isSaving ? 'Salvando...' : 'Salvar RDO'}
                </button>
              </>
            )}
            <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-bold shadow-lg shadow-blue-900/20 transition-all text-white">
              GERAR PDF
            </button>
          </div>
        </nav>

        <div className="flex flex-1 overflow-hidden relative">

          {/* ================= LEFT SIDE: FORM ================= */}
          <aside className={`w-full lg:w-[380px] xl:w-[420px] bg-slate-900/40 border-r border-slate-800 flex flex-col ${viewMode === 'form' ? 'flex' : 'hidden lg:flex'}`}>
            <fieldset disabled={role === 'leitura'} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 lg:pb-8">

              {/* 1. Dados Principais */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Dados Principais</h2>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nome da Obra</label>
                    <input
                      type="text" value={report.obra} onChange={(e) => handleChange('obra', e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white w-full transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Empresa</label>
                    <input
                      type="text" value={report.empresa} onChange={(e) => handleChange('empresa', e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white w-full transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Data</label>
                      <input
                        type="date" value={report.data} onChange={(e) => handleChange('data', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Logo</label>
                      <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded p-2 text-sm text-center text-blue-400 cursor-pointer transition-colors w-20 flex justify-center items-center">
                        <span className="truncate">{report.logoUrl ? 'Trocar' : 'Envio'}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Resp. Técnico</label>
                      <input
                        type="text" value={report.responsavel} onChange={(e) => handleChange('responsavel', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CREA</label>
                      <input
                        type="text" value={report.crea} onChange={(e) => handleChange('crea', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-white w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Condições Climáticas */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Cond. Climáticas</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700 flex flex-col items-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">Manhã</span>
                    <div className="flex gap-1 bg-slate-900 rounded p-1">
                      {(['sunny', 'cloudy', 'rainy'] as const).map(w => (
                        <button key={w} onClick={() => handleChange('climaManha', w)} className={`p-1.5 rounded transition-all ${report.climaManha === w ? 'bg-slate-700 text-blue-400 ring-1 ring-blue-500/50' : 'text-slate-500'}`}>
                          {w === 'sunny' && <Sun size={16} />}
                          {w === 'cloudy' && <Cloud size={16} />}
                          {w === 'rainy' && <CloudRain size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700 flex flex-col items-center">
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-2">Tarde</span>
                    <div className="flex gap-1 bg-slate-900 rounded p-1">
                      {(['sunny', 'cloudy', 'rainy'] as const).map(w => (
                        <button key={w} onClick={() => handleChange('climaTarde', w)} className={`p-1.5 rounded transition-all ${report.climaTarde === w ? 'bg-slate-700 text-blue-400 ring-1 ring-blue-500/50' : 'text-slate-500'}`}>
                          {w === 'sunny' && <Sun size={16} />}
                          {w === 'cloudy' && <Cloud size={16} />}
                          {w === 'rainy' && <CloudRain size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Efetivo */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Efetivo da Obra</h2>
                <datalist id="roles-list">
                  <option value="Engenheiro" />
                  <option value="Mestre de Obras" />
                  <option value="Encarregado" />
                  <option value="Pedreiro" />
                  <option value="Servente" />
                  <option value="Armador" />
                  <option value="Carpinteiro" />
                  <option value="Eletricista" />
                  <option value="Encanador" />
                  <option value="Pintor" />
                  <option value="Ajudante" />
                </datalist>
                <div className="space-y-2">
                  {report.efetivo.map((ef) => (
                    <div key={ef.id} className="flex gap-2 items-center bg-slate-800/20 p-2 border border-slate-800 rounded">
                      <input
                        type="text" list="roles-list" value={ef.role} onChange={e => updateEfetivo(ef.id, 'role', e.target.value)} placeholder="Função"
                        className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0 px-1" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Qtd:</span>
                        <input type="number" value={ef.quantidade} onChange={e => updateEfetivo(ef.id, 'quantidade', parseInt(e.target.value) || 0)} className="w-14 bg-slate-800 border border-slate-700 rounded text-center text-sm p-1 outline-none focus:border-blue-500" />
                      </div>
                      <button onClick={() => removeEfetivo(ef.id)} className="p-1 text-slate-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}
                  <button onClick={addEfetivo} className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 border-dashed text-blue-400 text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors mt-2">
                    <Plus size={16} /> Adicionar Efetivo
                  </button>
                </div>
              </div>

              {/* 4. Serviços */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Serviços</h2>
                <datalist id="categorias-list">
                  <option value="ADMINISTRAÇÃO LOCAL" />
                  <option value="ARRANQUE DE PILARES" />
                  <option value="BLOCOS DE COROAMENTO" />
                  <option value="COBERTURA" />
                  <option value="CONSTRUÇÃO - RESERVATÓRIO ELEVADO" />
                  <option value="DEMOLIÇÕES E RETIRADAS" />
                  <option value="DRENAGEM DE ÁGUAS PLUVIAIS" />
                  <option value="ESQUADRIAS" />
                  <option value="ESTACAS PRÉ-MOLDADAS" />
                  <option value="ESTRUTURA" />
                  <option value="ESTRUTURA METÁLICA PARA COBERTURA ALTA" />
                  <option value="ESTRUTURA METÁLICA PARA COBERTURA BAIXA" />
                  <option value="ETE" />
                  <option value="FUNDAÇÃO" />
                  <option value="IMPERMEABILIZAÇÕES" />
                  <option value="INFRAESTRUTURA" />
                  <option value="INSTALAÇÕES DE AR CONDICIONADO" />
                  <option value="INSTALAÇÕES DE CABEAMENTO ESTRUTURADO" />
                  <option value="INSTALAÇÕES DE COMBATE A INCÊNDIO E PÂNICO" />
                  <option value="INSTALAÇÕES DE SPDA" />
                  <option value="INSTALAÇÕES ELÉTRICAS" />
                  <option value="INSTALAÇÕES HIDRÁULICAS" />
                  <option value="INSTALAÇÕES SANITÁRIAS" />
                  <option value="LOUÇAS, BANCADAS E METAIS" />
                  <option value="MOVIMENTAÇÃO DE TERRA" />
                  <option value="PAREDES E PAINÉIS" />
                  <option value="PAVIMENTAÇÃO" />
                  <option value="PILARES" />
                  <option value="PILARES DE APOIO DA COBERTURA BAIXA" />
                  <option value="PINTURA" />
                  <option value="PINTURA DE PAREDES" />
                  <option value="PINTURA EM METAIS" />
                  <option value="PINTURA EM PAREDES EXTERNAS" />
                  <option value="PINTURA EM PISO" />
                  <option value="PINTURA EM TETOS" />
                  <option value="RECONSTRUÇÃO DA LAJE (PISO) DO SALÃO" />
                  <option value="RECUPERAÇÃO DE PILARES INTERNOS E REFORÇO ESTRUTURAL APOIO DA COBERTURA ALTA" />
                  <option value="REDE DE ESGOTO" />
                  <option value="RESERVATÓRIO" />
                  <option value="REVESTIMENTOS" />
                  <option value="REVESTIMENTO DE PAREDES EXTERNAS" />
                  <option value="REVESTIMENTO DE TETOS" />
                  <option value="SERVIÇOS PRELIMINARES" />
                  <option value="SERVIÇOS COMPLEMENTARES" />
                  <option value="SERVIÇOS INICIAIS" />
                  <option value="SERVIÇOS FINAIS" />
                  <option value="SUPERESTRUTURA" />
                  <option value="TELHAMENTO COBERTURA ALTA" />
                  <option value="TELHAMENTO COBERTURA BAIXA" />
                  <option value="VIGAS" />
                  <option value="VIGAS BALDRAMES" />
                </datalist>
                <datalist id="locais-list">
                  <option value="ÁREAS MOLHADAS" />
                  <option value="CAIXA D'ÁGUA" />
                  <option value="COBERTURA" />
                  <option value="REGIÕES EXTERNAS" />
                  <option value="REGIÕES INTERNAS" />
                  <option value="REGIÕES INTERNAS E EXTERNAS" />
                  <option value="SALÃO PRINCIPAL" />
                </datalist>
                <div className="space-y-3">
                  {report.servicos.map((srv) => (
                    <div key={srv.id} className="flex flex-col gap-2 bg-slate-800/20 p-3 border border-slate-800 rounded relative">
                      <button onClick={() => removeServico(srv.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><X size={14} /></button>
                      <input
                        type="text" value={srv.description} onChange={e => updateServico(srv.id, 'description', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded py-1.5 px-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none w-[90%]" placeholder="Descrição"
                      />
                      <input
                        type="text" list="categorias-list" value={srv.categoria || ''} onChange={e => updateServico(srv.id, 'categoria', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded py-1.5 px-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none uppercase" placeholder="Categoria"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text" list="locais-list" value={srv.local} onChange={e => updateServico(srv.id, 'local', e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded py-1.5 px-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none uppercase" placeholder="Local"
                        />
                        <select
                          value={srv.status} onChange={e => updateServico(srv.id, 'status', e.target.value)}
                          className="w-28 bg-slate-800 border border-slate-700 rounded py-1.5 px-1 text-[10px] font-bold tracking-widest uppercase focus:ring-1 focus:ring-blue-500 outline-none text-slate-300"
                        >
                          <option value="INICIADO">INICIADO</option>
                          <option value="EM ANDAMENTO">ANDAMENTO</option>
                          <option value="CONCLUÍDO">CONCLUÍDO</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  <button onClick={addServico} className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 border-dashed text-blue-400 text-sm py-2 rounded flex items-center justify-center gap-2 transition-colors">
                    <Plus size={16} /> Adicionar Serviço
                  </button>
                </div>
              </div>

              {/* 5. Ocorrências */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Ocorrências</h2>
                <textarea
                  value={report.ocorrencias} onChange={e => handleChange('ocorrencias', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px] resize-none" placeholder="Relatar faltas, clima extremo..."
                />
              </div>

              {/* 6. Fotos */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Fotos</h2>
                <div className="grid grid-cols-2 gap-2">
                  {report.fotos.map(foto => (
                    <div key={foto.id} className="relative group">
                      <img src={foto.url} alt="Envio" className="w-full aspect-video object-cover rounded border border-slate-700 opacity-80 group-hover:opacity-100 transition-opacity" />
                      <button onClick={() => removeFoto(foto.id)} className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded flex items-center justify-center text-white p-0.5"><X size={12} /></button>
                      <input
                        type="text" value={foto.caption} onChange={e => updateFotoCaption(foto.id, e.target.value)} placeholder="Legenda..."
                        className="absolute bottom-0 w-full bg-slate-900/90 text-[10px] px-2 py-1 outline-none placeholder:text-slate-500"
                      />
                    </div>
                  ))}
                  <label className="aspect-video bg-slate-800/50 hover:bg-slate-800 border border-slate-700 border-dashed rounded text-slate-500 hover:text-blue-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                    <Camera size={20} />
                    <span className="text-[10px] font-bold uppercase">Adicionar</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'foto')} className="hidden" />
                  </label>
                </div>
              </div>

            </fieldset>
          </aside>

          {/* ================= RIGHT SIDE: A4 PREVIEW ================= */}
          <main className={`flex-1 bg-[#10131c] lg:p-8 flex items-start justify-center relative overflow-y-auto ${viewMode === 'preview' ? 'flex' : 'hidden lg:flex'} pt-8`}>
            {viewMode === 'preview' && (
              <button onClick={() => setViewMode('form')} className="absolute top-4 left-4 lg:hidden p-2 bg-slate-800 rounded-md z-10 flex gap-2 text-sm font-bold items-center border border-slate-700">
                <ArrowLeft size={16} /> Voltar
              </button>
            )}

            {/* The Actual Display Paper Element */}
            <div className="w-full origin-top transition-transform duration-300 scale-[0.55] sm:scale-[0.75] md:scale-[0.80] lg:scale-[0.85] xl:scale-100 flex flex-col items-center pb-32 mb-32 shrink-0">
              <A4Document data={report} />
            </div>
          </main>

          {/* ================= MOBILE BOTTOM BAR ================= */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 z-40 lg:hidden flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')}
              className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm font-bold uppercase tracking-widest py-3 rounded text-slate-300 transition-colors"
            >
              {viewMode === 'form' ? 'Ver A4' : 'Editar'}
            </button>
            {viewMode === 'preview' && (
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-widest py-3 rounded shadow-lg shadow-blue-900/20"
              >
                Imprimir
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ================= HIDDEN PRINT DOM ================= */}
      <div className="hidden print:block fixed inset-0 z-50 bg-white">
        <A4Document data={report} />
      </div>
    </ProtectedRoute>
  );
}

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-bold tracking-widest uppercase">Carregando RDO...</div>}>
      <DailyReportApp />
    </Suspense>
  );
}
