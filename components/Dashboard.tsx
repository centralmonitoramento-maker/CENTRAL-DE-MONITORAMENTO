
import React, { useState, useEffect, useMemo } from 'react';
import { ZendeskTicket, OccurrenceCategory } from '../types';
import { zendeskService } from '../services/zendeskService';

interface DashboardProps {
  viewMode?: 'cards' | 'table';
}

const Dashboard: React.FC<DashboardProps> = ({ viewMode = 'cards' }) => {
  const [tickets, setTickets] = useState<ZendeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<ZendeskTicket | null>(null);
  
  // Intervalo de data padrão: últimos 30 dias
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
        (t.requester_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDate && matchesCategory && matchesSearch;
    });
  }, [tickets, searchTerm, filterCategory, startDate, endDate]);

  const clearDatabase = () => {
    if (confirm("ATENÇÃO: Isso apagará todo o histórico local. Deseja continuar?")) {
      localStorage.removeItem('sos_pro_occurrence_db');
      loadData();
    }
  };

  const exportCSV = () => {
    const headers = ["Protocolo", "Data", "Unidade", "Categoria", "Solicitante", "Descricao"];
    const rows = filteredData.map(t => [
      `CODD-${t.id}`,
      new Date(t.created_at).toLocaleDateString(),
      t.branch,
      t.category,
      t.requester_name,
      t.description.replace(/\n/g, ' ')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "banco_de_dados_ocorrencias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4">
      {/* Bloco de Gestão e Filtros */}
      <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl border-2 border-slate-100 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-slate-50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">Banco de Dados de Ocorrências</h2>
            <p className="text-[10px] font-bold text-black opacity-50 uppercase tracking-widest">Controle Gerencial - Prevenção de Perdas</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={exportCSV} className="flex-1 md:flex-none px-6 py-4 bg-black text-yellow-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Baixar CSV</button>
            <button onClick={clearDatabase} className="px-6 py-4 bg-red-600 text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Limpar DB</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-black uppercase mb-2">Busca Inteligente (Texto Livre)</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-black font-black uppercase text-xs outline-none focus:border-red-600"
              placeholder="Digite protocolo, nome ou parte do relato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-black uppercase mb-2">Tipo de Ocorrência</label>
            <select 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-black font-black uppercase text-xs"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              {Object.values(OccurrenceCategory).filter(v => v !== '').map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black text-black uppercase mb-2">De:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-black" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase mb-2">Até:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Visualização de Tabela */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-2 border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest text-left">
                  <th className="p-6">Protocolo</th>
                  <th className="p-6">Data/Hora</th>
                  <th className="p-6">Unidade/Local</th>
                  <th className="p-6">Categoria</th>
                  <th className="p-6">Solicitante</th>
                  <th className="p-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-black font-bold text-[11px] uppercase">
                {filteredData.length > 0 ? filteredData.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-6 font-black text-red-600">CODD-{t.id}</td>
                    <td className="p-6">{new Date(t.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-6">
                      <div className="font-black text-black">{t.branch}</div>
                      <div className="text-[9px] opacity-60">{t.location}</div>
                    </td>
                    <td className="p-6">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black">{t.category?.replace('_', ' ')}</span>
                    </td>
                    <td className="p-6">{t.requester_name}</td>
                    <td className="p-6 text-center">
                      <button 
                        onClick={() => setSelectedTicket(t)} 
                        className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black hover:bg-red-600 transition-colors"
                      >
                        CONSULTAR
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-24 text-center text-black font-black uppercase italic opacity-30">
                      Nenhum registro localizado no banco de dados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visualização resumida em Cards para Mobile */
        <div className="grid grid-cols-1 gap-4">
          {filteredData.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-[35px] shadow-lg border-2 border-slate-100 border-l-8 border-l-black flex justify-between items-center animate-in slide-in-from-bottom duration-300">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-red-600">CODD-{t.id}</span>
                  <span className="text-[10px] font-black text-black opacity-40">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <h4 className="text-sm font-black text-black uppercase">{t.subject}</h4>
                <p className="text-[9px] font-bold text-black opacity-60 uppercase">📍 {t.branch} | 👤 {t.requester_name}</p>
              </div>
              <button onClick={() => setSelectedTicket(t)} className="p-4 bg-slate-100 rounded-2xl">📑</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes - Contraste Extremo */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[50px] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-[#E63946] p-10 text-black relative">
              <button onClick={() => setSelectedTicket(null)} className="absolute top-8 right-8 text-3xl font-black">✕</button>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Relatório Oficial de Sinistro</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight">CODD-{selectedTicket.id}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-2 gap-8 border-b-2 border-slate-100 pb-8">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-30 uppercase">Unidade</label>
                   <p className="text-md font-black text-black uppercase">{selectedTicket.branch}</p>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-30 uppercase">Local</label>
                   <p className="text-md font-black text-black uppercase">{selectedTicket.location}</p>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-30 uppercase">Data do Registro</label>
                   <p className="text-md font-black text-black uppercase">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-black opacity-30 uppercase">Solicitante</label>
                   <p className="text-md font-black text-black uppercase">{selectedTicket.requester_name}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-black uppercase tracking-widest">Relato dos Fatos:</label>
                <div className="bg-slate-50 p-8 rounded-[35px] border-2 border-slate-100 text-sm font-bold text-black uppercase leading-relaxed shadow-inner">
                  {selectedTicket.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setSelectedTicket(null)} className="w-full py-6 bg-black text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Fechar Consulta</button>
                <button className="w-full py-6 bg-slate-100 text-black border-2 border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest">Imprimir PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
