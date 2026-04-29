import React from 'react';

/* ================= TYPES ================= */

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy';

export interface Workforce {
  id: string;
  role: string;
  quantidade: number;
}

export interface Service {
  id: string;
  categoria?: string;
  description: string;
  local: string;
  status: 'INICIADO' | 'EM ANDAMENTO' | 'CONCLUÍDO';
}

export interface PhotoRecord {
  id: string;
  url: string;
  caption: string;
}

export interface ReportState {
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

export const INITIAL_STATE: ReportState = {
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

export const STATUS_COLORS = {
  'INICIADO': 'text-blue-600',
  'EM ANDAMENTO': 'text-amber-500',
  'CONCLUÍDO': 'text-green-600',
};

/* ================= HELPERS ================= */

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const getBasePath = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/rdo-app')) {
    return '/rdo-app';
  }
  return '';
};

/* ================= A4 PAGE COMPONENT ================= */

export const A4Page = ({ data, showMain, fotos, pageNum, totalPages }: { data: ReportState, showMain: boolean, fotos: PhotoRecord[], pageNum: number, totalPages: number }) => {
  const totalEfetivo = data.efetivo.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);

  const getCondText = (cond: WeatherCondition | null) => {
    if (cond === 'sunny') return '☀️ Ensolarado';
    if (cond === 'cloudy') return '⛅ Nublado';
    if (cond === 'rainy') return '🌧️ Chuvoso';
    return 'Não informado';
  };

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl mx-auto flex flex-col p-10 ring-1 ring-black/10 origin-top print:shadow-none print:w-full print:min-h-[277mm] print:h-[277mm] print:m-0 print:p-[5mm] print:ring-0 text-[11px] leading-relaxed relative print:break-after-page page-break-after-always shrink-0">
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
          <div className="text-[10px] font-bold bg-slate-100 px-3 py-1 mb-2 border border-slate-200 tracking-widest text-slate-700">v1.36</div>
          <p className="text-[10px] uppercase font-bold text-slate-800">Data: {formatDate(data.data)}</p>
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Clima: M: {getCondText(data.climaManha)} / T: {getCondText(data.climaTarde)}</p>
        </div>
      </header>

      {/* Info Blocks */}
      <section className="flex-1 flex flex-col print:bg-white">
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
                      <td colSpan={5} className="py-2 text-slate-400 italic">Nenhum serviço registrado.</td>
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

export const A4Document = ({ data }: { data: ReportState }) => {
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
