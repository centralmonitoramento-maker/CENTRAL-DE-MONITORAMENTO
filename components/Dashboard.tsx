
import React, { useState, useEffect, useMemo } from 'react';
import { ZendeskTicket, TicketNotification, OccurrenceCategory } from '../types';
import { zendeskService } from '../services/zendeskService';

interface DashboardProps {
  viewMode?: 'cards' | 'table';
}

const Dashboard: React.FC<DashboardProps> = ({ viewMode = 'cards' }) => {
  const [tickets, setTickets] = useState<ZendeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ZendeskTicket | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Filtros de Data
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await zendeskService.getRecentTickets();
    if (res.success && res.data) setTickets(res.data);
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return tickets.filter(t => {
      const ticketDate = new Date(t.created_at).getTime();
      const s = new Date(startDate + 'T00:00:00').getTime();
      const e = new Date(endDate + 'T23:59:59').getTime();
      
      const matchesDate = ticketDate >= s && ticketDate <= e;
      const matchesCategory = !filterCategory || t.category === filterCategory;
      const matchesSearch = !searchTerm || 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toString().includes(searchTerm) ||
        (t.requester_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDate && matchesCategory && matchesSearch;
    });
  }, [tickets, searchTerm, filterCategory, startDate, endDate]);

  const exportToPDF = (ticket: ZendeskTicket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoDiaADia = "https://i.ibb.co/vzB7pG0/logo.png";
    const logoPrevenção = "https://cdn-icons-png.flaticon.com/512/9322/9322127.png"; 

    const html = `
      <html>
        <head>
          <title>FR-PP-01 - CODD-${ticket.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #000; }
            .page { padding: 1.5cm; position: relative; min-height: 297mm; box-sizing: border-box; background: white; }
            .corner-logo { position: absolute; top: 0.5cm; left: 0.5cm; width: 2cm; height: 2cm; opacity: 0.8; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; margin-left: 2cm; width: calc(100% - 2cm); }
            .header-table td { border: 1px solid #000; padding: 10px; vertical-align: middle; }
            .section-title { background: #f0f0f0; border: 1px solid #000; font-weight: 900; padding: 8px; text-transform: uppercase; text-align: center; margin-top: 15px; }
            .content-box { border: 1px solid #000; padding: 15px; min-height: 300px; font-weight: bold; text-transform: uppercase; line-height: 1.6; }
            .form-table { width: 100%; border-collapse: collapse; }
            .form-table td { border: 1px solid #000; padding: 8px; font-size: 9pt; }
            .label { font-size: 7pt; font-weight: bold; display: block; margin-bottom: 2px; }
            .val { font-weight: 900; font-size: 10pt; }
          </style>
        </head>
        <body>
          <div class="page">
            <img src="${logoPrevenção}" class="corner-logo" />
            <table class="header-table">
              <tr>
                <td style="width:20%; text-align:center"><img src="${logoDiaADia}" style="height:40px" /></td>
                <td style="text-align:center">
                  <div style="font-weight:900; font-size:12pt">PREVENÇÃO DE PERDAS</div>
                  <div style="font-size:8pt">RELATÓRIO DE SINISTRO SOS-PRO</div>
                </td>
                <td style="width:20%; font-size:7pt; font-weight:bold; text-align:right">FR-PP-01<br/>ID: ${ticket.id}</td>
              </tr>
            </table>
            
            <div class="section-title">Dados da Ocorrência</div>
            <table class="form-table">
              <tr>
                <td colspan="2"><span class="label">UNIDADE:</span><span class="val">${ticket.branch}</span></td>
                <td><span class="label">DATA:</span><span class="val">${new Date(ticket.created_at).toLocaleDateString()}</span></td>
              </tr>
              <tr>
                <td><span class="label">LOCAL:</span><span class="val">${ticket.location}</span></td>
                <td><span class="label">TIPO:</span><span class="val">${ticket.category?.toUpperCase()}</span></td>
                <td><span class="label">SOLICITANTE:</span><span class="val">${ticket.requester_name}</span></td>
              </tr>
            </table>

            <div class="section-title">Relato dos Fatos</div>
            <div class="content-box">${ticket.description}</div>

            <div style="margin-top:40px; border-top:1px solid #000; width:50%; margin-left:auto; margin-right:auto; text-align:center; padding-top:10px; font-size:8pt; font-weight:bold">
              ASSINATURA DO RESPONSÁVEL
            </div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho de Filtros */}
      <div className="bg-white p-8 rounded-[40px] shadow-2xl border-2 border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-black uppercase tracking-tight">
            {viewMode === 'table' ? 'Banco de Dados Gerenciável' : 'Histórico de Registros'}
          </h2>
          <div className="flex gap-2">
             <button onClick={loadData} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200">🔄</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-black uppercase mb-1">Pesquisa Geral</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-black font-bold uppercase text-xs outline-none focus:border-red-500"
              placeholder="Protocolo, Nome, Relato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-black uppercase mb-1">Categoria</label>
            <select 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-black font-bold uppercase text-xs"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Todas</option>
              {Object.values(OccurrenceCategory).filter(v => v !== '').map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-black uppercase mb-1">Início</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-bold text-black" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase mb-1">Fim</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-bold text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Visualização de Tabela (Banco de Dados) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-5 text-left">ID</th>
                  <th className="p-5 text-left">Data</th>
                  <th className="p-5 text-left">Unidade</th>
                  <th className="p-5 text-left">Categoria</th>
                  <th className="p-5 text-left">Solicitante</th>
                  <th className="p-5 text-left">Status</th>
                  <th className="p-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-black font-bold text-[11px] uppercase">
                {filteredData.length > 0 ? filteredData.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-black text-red-600">CODD-{t.id}</td>
                    <td className="p-5">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-5">{t.branch}</td>
                    <td className="p-5">{t.category?.replace('_', ' ')}</td>
                    <td className="p-5">{t.requester_name}</td>
                    <td className="p-5">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black ${
                         t.status === 'new' ? 'bg-blue-100' : 'bg-green-100'
                       }`}>{t.status}</span>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => setSelectedTicket(t)} className="p-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter">Detalhar</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-20 text-center text-slate-300 font-black uppercase italic">Nenhuma ocorrência encontrada no banco de dados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visualização de Cards (Histórico) */
        <div className="grid grid-cols-1 gap-6">
          {filteredData.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-[35px] shadow-lg border-2 border-slate-50 border-l-8 border-l-black flex justify-between items-center group">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-black bg-yellow-400 px-3 py-1 rounded-full uppercase">CODD-{t.id}</span>
                  <span className="text-[10px] font-black text-black opacity-50 uppercase">{new Date(t.created_at).toLocaleString()}</span>
                </div>
                <h4 className="text-md font-black text-black uppercase leading-none">{t.subject}</h4>
                <p className="text-[10px] font-bold text-black opacity-60 uppercase truncate max-w-md">📍 {t.branch} - {t.location}</p>
              </div>
              <button onClick={() => setSelectedTicket(t)} className="px-6 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Ver Detalhes</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes (Contraste Máximo) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[50px] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#E63946] p-10 text-black relative">
              <button onClick={() => setSelectedTicket(null)} className="absolute top-8 right-8 text-3xl font-black">✕</button>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight">OCORRÊNCIA<br/>CODD-{selectedTicket.id}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8 border-b-2 border-slate-100 pb-8">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-40 uppercase">Filial Responsável</label>
                   <p className="text-lg font-black text-black uppercase">{selectedTicket.branch}</p>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-40 uppercase">Local Específico</label>
                   <p className="text-lg font-black text-black uppercase">{selectedTicket.location}</p>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-40 uppercase">Data e Hora do Registro</label>
                   <p className="text-lg font-black text-black uppercase">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-40 uppercase">Categoria</label>
                   <p className="text-lg font-black text-black uppercase">{selectedTicket.category?.replace('_', ' ')}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-black uppercase tracking-widest">Relato dos Fatos (Relatório de Campo)</label>
                <div className="bg-slate-50 p-8 rounded-[35px] border-2 border-slate-100 text-sm font-bold text-black uppercase leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-10">
                <button onClick={() => exportToPDF(selectedTicket)} className="py-6 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">📑 Gerar PDF para Auditoria</button>
                <button onClick={() => setSelectedTicket(null)} className="py-6 bg-slate-100 text-black rounded-3xl font-black text-xs uppercase tracking-widest border-2 border-slate-200">Sair da Consulta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
