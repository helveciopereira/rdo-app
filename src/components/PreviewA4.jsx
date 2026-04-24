// v0.1
import React from 'react';

const PreviewA4 = ({ data, previewRef }) => {
  const { empresa, obra, data: dataRdo, climaManha, climaTarde, efetivo, servicos, ocorrencias, fotos, logo } = data;

  return (
    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', background: '#00000022', overflowY: 'auto', maxHeight: '100vh' }}>
      <div 
        ref={previewRef}
        className="a4-wrapper pdf-container"
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: 'white',
          padding: '20mm',
          border: '1px solid #ccc',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          color: '#000',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Cabeçalho */}
        <header style={{ display: 'flex', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
             {logo ? (
                <img src={logo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '150px' }} />
             ) : (
                <div style={{ height: '60px', width: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>Logo Empresa</div>
             )}
          </div>
          <div style={{ flex: 2, textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 5px 0' }}>RELATÓRIO DIÁRIO DE OBRAS</h2>
            <h3 style={{ margin: 0, fontWeight: 'normal' }}>{empresa || 'Nome da Empresa'}</h3>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{ margin: '0 0 5px 0' }}><strong>Data:</strong> {dataRdo || '__/__/____'}</p>
          </div>
        </header>

        {/* Informações Gerais */}
        <section style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '20%' }}>Obra:</td>
                <td colSpan="3" style={{ border: '1px solid #000', padding: '5px' }}>{obra || 'Nome/Endereço da Obra'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold' }}>Clima Manhã:</td>
                <td style={{ border: '1px solid #000', padding: '5px', width: '30%' }}>{climaManha || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '5px', fontWeight: 'bold', width: '20%' }}>Clima Tarde:</td>
                <td style={{ border: '1px solid #000', padding: '5px', width: '30%' }}>{climaTarde || '-'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Efetivo */}
        <section style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #ccc' }}>1. Efetivo de Obra</h4>
          {efetivo && efetivo.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', width: '80%' }}>Função profissional</th>
                  <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {efetivo.map((ef, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>{ef.funcao}</td>
                    <td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{ef.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ margin: '5px 0', color: '#555', fontStyle: 'italic', fontSize: '13px' }}>Nenhum efetivo registrado.</p>
          )}
        </section>

        {/* Serviços Executados */}
        <section style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #ccc' }}>2. Serviços em Execução</h4>
          {servicos && servicos.length > 0 ? (
            <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
              {servicos.map((srv, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{srv.descricao}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: '5px 0', color: '#555', fontStyle: 'italic', fontSize: '13px' }}>Nenhum serviço registrado.</p>
          )}
        </section>

        {/* Ocorrências */}
        <section style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #ccc' }}>3. Ocorrências / Observações</h4>
          <div style={{ border: '1px solid #000', padding: '10px', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
            {ocorrencias || 'Sem ocorrências no dia.'}
          </div>
        </section>

        {/* Fotos */}
        {fotos && fotos.length > 0 && (
          <section style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ccc' }}>4. Relatório Fotográfico</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {fotos.map((foto, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', padding: '5px', textAlign: 'center' }}>
                  <img src={foto.url} alt={`Foto ${idx+1}`} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  {foto.legenda && <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>{foto.legenda}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default PreviewA4;
