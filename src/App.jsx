// v0.2
import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import FormRDO from './components/FormRDO';
import PreviewA4 from './components/PreviewA4';

function App() {
  const [data, setData] = useState({
    empresa: '',
    logo: null,
    obra: '',
    data: new Date().toISOString().slice(0, 10),
    climaManha: '',
    climaTarde: '',
    efetivo: [],
    servicos: [],
    ocorrencias: '',
    fotos: []
  });

  const previewRef = useRef(null);

  const handleGeneratePDF = async () => {
    const element = previewRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Melhor qualidade
        useCORS: true, 
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4 format: 210mm x 297mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`RDO_${data.data || 'Documento'}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Houve um erro ao gerar o PDF. Verifique o console.");
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Lado Esquerdo: Formulário */}
      <div style={{ width: '40%', minWidth: '400px', borderRight: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
        <FormRDO 
          data={data} 
          setData={setData} 
          handleGeneratePDF={handleGeneratePDF} 
        />
      </div>

      {/* Lado Direito: Preview */}
      <div style={{ flex: 1, position: 'relative' }}>
         {/* Adiciona um overlay para deixar claro que é apenas visualização */}
         <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--primary-color)', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', zIndex: 50 }}>
            Preview A4 Ao Vivo
         </div>
         <PreviewA4 
           data={data} 
           previewRef={previewRef} 
         />
      </div>
      
    </div>
  );
}

export default App;
