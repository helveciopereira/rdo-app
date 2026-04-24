// v0.1
import React from 'react';
import { Camera, Plus, Trash2, Download } from 'lucide-react';

const FormRDO = ({ data, setData, handleGeneratePDF }) => {

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (upload) => {
        handleChange('logo', upload.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEfetivo = () => {
    handleChange('efetivo', [...data.efetivo, { funcao: '', quantidade: '' }]);
  };

  const handlEfetivoChange = (index, field, value) => {
    const newEfetivo = [...data.efetivo];
    newEfetivo[index][field] = value;
    handleChange('efetivo', newEfetivo);
  };

  const handleRemoveEfetivo = (index) => {
    const newEfetivo = data.efetivo.filter((_, i) => i !== index);
    handleChange('efetivo', newEfetivo);
  };

  const handleAddServico = () => {
    handleChange('servicos', [...data.servicos, { descricao: '' }]);
  };

  const handleServicoChange = (index, value) => {
    const newServ = [...data.servicos];
    newServ[index].descricao = value;
    handleChange('servicos', newServ);
  };

  const handleRemoveServico = (index) => {
    handleChange('servicos', data.servicos.filter((_, i) => i !== index));
  };

  const handleFotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (upload) => {
        handleChange('fotos', [...data.fotos, { url: upload.target.result, legenda: '' }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFotoLegenda = (index, value) => {
    const newFotos = [...data.fotos];
    newFotos[index].legenda = value;
    handleChange('fotos', newFotos);
  };

  const handleRemoveFoto = (index) => {
    handleChange('fotos', data.fotos.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#2f81f7', margin: 0 }}>Gerador RDO</h2>
        <button className="btn btn-primary animate-fade-in" onClick={handleGeneratePDF}>
          <Download size={18} /> Gerar PDF
        </button>
      </div>

      <div className="form-group">
        <label>Logo da Empresa</label>
        <input type="file" accept="image/*" className="form-input" onChange={handleLogoUpload} />
      </div>

      <div className="form-group">
        <label>Empresa Executora</label>
        <input type="text" className="form-input" placeholder="Ex: Engenharia SA" value={data.empresa} onChange={(e) => handleChange('empresa', e.target.value)} />
      </div>

      <div className="form-group">
        <label>Nome / Local da Obra</label>
        <input type="text" className="form-input" placeholder="Ex: Residencial Flores - Bloco B" value={data.obra} onChange={(e) => handleChange('obra', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Data</label>
          <input type="date" className="form-input" value={data.data} onChange={(e) => handleChange('data', e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Clima: Manhã</label>
          <select className="form-input" value={data.climaManha} onChange={(e) => handleChange('climaManha', e.target.value)}>
             <option value="">Selecione...</option>
             <option value="Ensolarado">Ensolarado</option>
             <option value="Nublado">Nublado</option>
             <option value="Chuvoso">Chuvoso</option>
             <option value="Chuva Forte">Chuva Forte</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Clima: Tarde</label>
          <select className="form-input" value={data.climaTarde} onChange={(e) => handleChange('climaTarde', e.target.value)}>
             <option value="">Selecione...</option>
             <option value="Ensolarado">Ensolarado</option>
             <option value="Nublado">Nublado</option>
             <option value="Chuvoso">Chuvoso</option>
             <option value="Chuva Forte">Chuva Forte</option>
          </select>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--panel-border)', margin: '2rem 0' }} />

      <h3>Efetivo de Obra</h3>
      {data.efetivo.map((ef, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="text" className="form-input" style={{ flex: 3 }} placeholder="Função (Ex: Pedreiro)"
            value={ef.funcao} onChange={(e) => handlEfetivoChange(idx, 'funcao', e.target.value)}
          />
          <input 
            type="number" className="form-input" style={{ flex: 1 }} placeholder="Qtd"
            value={ef.quantidade} onChange={(e) => handlEfetivoChange(idx, 'quantidade', e.target.value)}
          />
          <button className="btn" style={{ padding: '0 0.5rem', borderColor: '#ff4444', color: '#ff4444' }} onClick={() => handleRemoveEfetivo(idx)}>
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <button className="btn" style={{ width: '100%', marginBottom: '2rem' }} onClick={handleAddEfetivo}>
        <Plus size={18} /> Adicionar Efetivo
      </button>

      <h3>Serviços Executados</h3>
      {data.servicos.map((serv, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="text" className="form-input" style={{ flex: 1 }} placeholder="Descrição do serviço"
            value={serv.descricao} onChange={(e) => handleServicoChange(idx, e.target.value)}
          />
          <button className="btn" style={{ padding: '0 0.5rem', borderColor: '#ff4444', color: '#ff4444' }} onClick={() => handleRemoveServico(idx)}>
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <button className="btn" style={{ width: '100%', marginBottom: '2rem' }} onClick={handleAddServico}>
        <Plus size={18} /> Adicionar Serviço
      </button>

      <h3>Ocorrências</h3>
      <div className="form-group">
        <textarea 
          className="form-textarea" 
          placeholder="Descreva ocorrências, acidentes, paralisações, etc..."
          value={data.ocorrencias}
          onChange={(e) => handleChange('ocorrencias', e.target.value)}
        />
      </div>

      <hr style={{ borderColor: 'var(--panel-border)', margin: '2rem 0' }} />

      <h3>Relatório Fotográfico</h3>
      <div className="form-group">
        <label>Anexar Imagem</label>
        <input type="file" accept="image/*" className="form-input" onChange={handleFotoUpload} />
      </div>
      
      {data.fotos.map((foto, idx) => (
        <div key={idx} className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <img src={foto.url} alt={`Preview ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
          <div style={{ flex: 1 }}>
             <input 
               type="text" className="form-input" style={{ width: '100%', marginBottom: '0.5rem' }} 
               placeholder="Legenda da foto..."
               value={foto.legenda} onChange={(e) => handleFotoLegenda(idx, e.target.value)}
             />
             <button className="btn" style={{ padding: '0.5rem', borderColor: '#ff4444', color: '#ff4444', fontSize: '0.8rem' }} onClick={() => handleRemoveFoto(idx)}>
               Remover Foto
             </button>
          </div>
        </div>
      ))}

    </div>
  );
};

export default FormRDO;
