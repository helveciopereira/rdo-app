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

const generateId = () => crypto.randomUUID();

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

import {
  WeatherCondition,
  Workforce,
  Service,
  PhotoRecord,
  ReportState,
  INITIAL_STATE,
  STATUS_COLORS,
  A4Document
} from '@/src/components/A4Document';

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
  const [errorState, setErrorState] = useState<string | null>(null);

  // IDs das fotos que já existiam no banco (para não inserir duplicatas ao salvar)
  const [originalPhotoIds, setOriginalPhotoIds] = useState<Set<string>>(new Set());

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        .abortSignal(controller.signal)
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
    } catch (err: any) {
      console.error("Nenhum RDO anterior ou erro ao buscar:", err);
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setErrorState('A conexão com o servidor expirou. Tente recarregar a página.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoaded(true);
    }
  };

  const fetchRDO = async (id: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        .abortSignal(controller.signal)
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

        // Salva os IDs das fotos originais para não duplicar ao salvar novas
        const idsOriginais = new Set<string>(relatorio.registros_fotograficos.map((f: any) => f.id as string));
        setOriginalPhotoIds(idsOriginais);
      }
    } catch (err: any) {
      console.error("Erro ao buscar RDO:", err);
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setErrorState('A conexão com o servidor expirou. Tente recarregar a página.');
      } else {
        setErrorState('Não foi possível carregar este relatório.');
      }
    } finally {
      clearTimeout(timeoutId);
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

  /**
   * Salva APENAS as fotos novas (que foram adicionadas após o RDO já ter sido salvo).
   * Não altera nenhum outro dado do relatório — apenas INSERT de registros fotográficos.
   */
  const handleSavePhotosToExistingRDO = async () => {
    if (!rdoId) return;

    // Filtra apenas as fotos que NÃO estão no banco original
    const novasFotos = report.fotos.filter(f => !originalPhotoIds.has(f.id));

    if (novasFotos.length === 0) {
      alert('Nenhuma foto nova para salvar.');
      return;
    }

    // Verifica se alguma foto ainda está sendo enviada
    const fotasPendentes = novasFotos.filter(f => f.caption === 'Enviando...');
    if (fotasPendentes.length > 0) {
      alert('Aguarde o upload das fotos terminar antes de salvar.');
      return;
    }

    try {
      setIsSaving(true);

      const fotosToInsert = novasFotos.map(foto => ({
        relatorio_id: rdoId,
        imagem_url: foto.url,
        legenda: foto.caption
      }));

      const { error: fotoError } = await supabase
        .from('registros_fotograficos')
        .insert(fotosToInsert);

      if (fotoError) throw fotoError;

      // Registra evento de auditoria
      await supabase.from('event_logs').insert({
        user_id: user?.id,
        acao: 'ADD_PHOTOS_RDO',
        detalhes: { rdo_id: rdoId, quantidade: novasFotos.length }
      });

      // Atualiza os IDs originais para incluir as fotos recém-salvas
      setOriginalPhotoIds(prev => {
        const novos = new Set(prev);
        novasFotos.forEach(f => novos.add(f.id));
        return novos;
      });

      alert(`${novasFotos.length} foto(s) salva(s) com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao salvar fotos:', error);
      alert('Erro ao salvar fotos: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="no-print h-screen flex flex-col overflow-hidden bg-slate-950 font-sans text-slate-200">
        
        {/* Loading/Error Overlay */}
        {(!isLoaded || errorState) && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
            {errorState ? (
              <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
                <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Falha na Inicialização</h3>
                  <p className="text-sm text-slate-400">{errorState}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-widest text-xs"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500 animate-pulse">Iniciando RDO...</p>
              </div>
            )}
          </div>
        )}

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
                {isEditing ? (
                  <button onClick={handleSavePhotosToExistingRDO} disabled={isSaving} className="hidden lg:block px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors text-white mr-2 disabled:opacity-50">
                    {isSaving ? 'Salvando...' : '📷 Salvar Fotos'}
                  </button>
                ) : (
                  <button onClick={handleSaveToDatabase} disabled={isSaving} className="hidden lg:block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors text-white mr-2 disabled:opacity-50">
                    {isSaving ? 'Salvando...' : 'Salvar RDO'}
                  </button>
                )}
              </>
            )}
            <button onClick={handlePrint} className="hidden lg:block px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-bold shadow-lg shadow-blue-900/20 transition-all text-white">
              GERAR PDF
            </button>
          </div>
        </nav>

        <div className="flex flex-1 overflow-hidden relative">

          {/* ================= LEFT SIDE: FORM ================= */}
          <aside className={`w-full lg:w-[380px] xl:w-[420px] bg-slate-900/40 border-r border-slate-800 flex flex-col ${viewMode === 'form' ? 'flex' : 'hidden lg:flex'}`}>
            <fieldset disabled={role === 'leitura' || isEditing} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 lg:pb-8">

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

              {/* 6. Fotos — FORA do fieldset disabled para permitir adição em RDOs já salvos */}
              </fieldset>
              <div className="px-6 pb-32 lg:pb-8 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Fotos</h2>

                {/* Banner informativo quando editando RDO existente */}
                {isEditing && (
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 flex items-start gap-2">
                    <Camera size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      Modo de edição: apenas <strong>fotos e legendas</strong> podem ser adicionadas. Os dados do relatório estão protegidos.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {report.fotos.map(foto => {
                    const isOriginal = originalPhotoIds.has(foto.id);
                    return (
                      <div key={foto.id} className="relative group">
                        <img src={foto.url} alt="Envio" className="w-full aspect-video object-cover rounded border border-slate-700 opacity-80 group-hover:opacity-100 transition-opacity" />

                        {/* Botão de remover: só aparece se a foto NÃO é original do banco */}
                        {!isOriginal && (
                          <button onClick={() => removeFoto(foto.id)} className="absolute top-1 right-1 bg-red-600 w-5 h-5 rounded flex items-center justify-center text-white p-0.5"><X size={12} /></button>
                        )}

                        {/* Indicador visual de foto já salva no banco */}
                        {isOriginal && isEditing && (
                          <div className="absolute top-1 left-1 bg-emerald-600/80 text-white text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Salva</div>
                        )}

                        <input
                          type="text" value={foto.caption} onChange={e => updateFotoCaption(foto.id, e.target.value)} placeholder="Legenda..."
                          className="absolute bottom-0 w-full bg-slate-900/90 text-[10px] px-2 py-1 outline-none placeholder:text-slate-500"
                          readOnly={isOriginal && isEditing}
                        />
                      </div>
                    );
                  })}
                  <label className="aspect-video bg-slate-800/50 hover:bg-slate-800 border border-slate-700 border-dashed rounded text-slate-500 hover:text-blue-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                    <Camera size={20} />
                    <span className="text-[10px] font-bold uppercase">Adicionar</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'foto')} className="hidden" />
                  </label>
                </div>
              </div>

              {/* 7. Ações do RDO (Mobile) — Predefinições só aparecem em modo criação */}
              {role !== 'leitura' && !isEditing && (
                <div className="px-6 space-y-4 pt-6 mt-6 border-t border-slate-800/50 lg:hidden">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Predefinições</h2>
                  <div className="flex gap-2">
                    <button onClick={saveTemplate} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors border border-slate-700 text-slate-300">
                      Salvar Modelo
                    </button>
                    <button onClick={loadTemplate} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-bold uppercase tracking-widest transition-colors border border-slate-700 text-slate-300">
                      Carregar Modelo
                    </button>
                  </div>
                </div>
              )}
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
              className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-bold uppercase tracking-widest py-3 rounded text-slate-300 transition-colors"
            >
              {viewMode === 'form' ? 'Ver A4' : 'Editar Form'}
            </button>
            {viewMode === 'form' && role !== 'leitura' && (
              isEditing ? (
               <button
                 onClick={handleSavePhotosToExistingRDO} disabled={isSaving}
                 className="flex-[1.5] bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded shadow-lg shadow-amber-900/20 disabled:opacity-50"
               >
                 {isSaving ? 'Salvando...' : '📷 Salvar Fotos'}
               </button>
              ) : (
               <button
                 onClick={handleSaveToDatabase} disabled={isSaving}
                 className="flex-[1.5] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded shadow-lg shadow-emerald-900/20 disabled:opacity-50"
               >
                 {isSaving ? 'Salvando...' : 'Salvar RDO'}
               </button>
              )
            )}
            {viewMode === 'preview' && (
              <button
                onClick={handlePrint}
                className="flex-[1.5] bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded shadow-lg shadow-blue-900/20"
              >
                Gerar PDF
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
