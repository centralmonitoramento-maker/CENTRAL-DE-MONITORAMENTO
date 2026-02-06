
import React, { useState, useEffect } from 'react';
import { ZendeskTicket, TicketNotification } from '../types';
import { zendeskService } from '../services/zendeskService';

const Dashboard: React.FC = () => {
  const [protocol, setProtocol] = useState('');
  const [tickets, setTickets] = useState<ZendeskTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Simulate real-time updates every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const res = await zendeskService.getNotifications();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocol) return;
    
    setLoading(true);
    setSearched(true);
    const res = await zendeskService.getTicketById(protocol);
    setLoading(false);
    if (res.success && res.data) {
      setTickets(res.data);
    } else {
      setTickets([]);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'open': return 'bg-orange-100 text-orange-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'solved': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return { 
          border: 'border-l-red-600', 
          bg: 'bg-red-100', 
          text: 'text-red-700', 
          dot: '🔴', 
          label: 'ALTA' 
        };
      case 'normal':
        return { 
          border: 'border-l-yellow-400', 
          bg: 'bg-yellow-100', 
          text: 'text-yellow-800', 
          dot: '🟡', 
          label: 'MÉDIA' 
        };
      case 'low':
      default:
        return { 
          border: 'border-l-green-500', 
          bg: 'bg-green-100', 
          text: 'text-green-700', 
          dot: '🟢', 
          label: 'BAIXA' 
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Dashboard Top Header with Notifications Bell */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Área do Usuário</h3>
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-4 rounded-2xl transition-all relative ${showNotifications ? 'bg-red-600 text-white' : 'bg-white text-slate-600 shadow-md hover:bg-slate-50'}`}
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Feed Dropdown/Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-[35px] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest">Feed de Atualizações</span>
                <span className="text-[9px] bg-red-600 px-2 py-0.5 rounded-full">{unreadCount} NOVAS</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Ticket #CODD-{n.ticketId}</span>
                          <span className="text-[8px] text-slate-400 font-bold">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{n.message}</p>
                        <div className="mt-2 flex gap-2">
                           <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                             n.type === 'urgent_alert' ? 'bg-red-100 text-red-700' : 
                             n.type === 'status_change' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                           }`}>
                             {n.type.replace('_', ' ')}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-slate-50 text-center">
                <button className="text-[9px] font-black text-slate-400 uppercase hover:text-red-600 transition-colors">Ver todas as atividades</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">🔎</div>
        <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Consulta de Protocolo</h3>
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="text"
              required
              className="w-full pl-12 pr-4 py-5 bg-[#f8f9fa] rounded-3xl border-2 border-slate-100 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-black font-black placeholder:text-slate-400 placeholder:font-normal uppercase"
              placeholder="Ex: CODD-123456"
              value={protocol}
              onChange={e => setProtocol(e.target.value.toUpperCase())}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl grayscale opacity-40">🆔</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-yellow-400 py-5 rounded-3xl font-black transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
          >
            {loading ? 'Consultando...' : 'Pesquisar Ocorrência'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20 bg-white/50 rounded-[40px] backdrop-blur-sm border-2 border-dashed border-slate-200">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Acessando Base de Dados CODD...</p>
        </div>
      )}

      {searched && !loading && tickets.length === 0 && (
        <div className="text-center py-20 bg-red-50 rounded-[40px] border-2 border-dashed border-red-200 animate-in zoom-in">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-700 font-black uppercase text-xs">Protocolo não localizado</p>
          <p className="text-red-500 text-[10px] mt-2 font-bold uppercase">Verifique o número e tente novamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 mb-20">
        {tickets.map(ticket => {
          const style = getPriorityStyle(ticket.priority);
          return (
            <div 
              key={ticket.id} 
              className={`bg-white p-6 rounded-[35px] shadow-xl border-2 border-slate-50 border-l-8 ${style.border} transition-all hover:scale-[1.01] flex flex-col md:flex-row justify-between items-start md:items-center group animate-in slide-in-from-bottom duration-500`}
            >
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full shadow-sm ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full shadow-sm ${style.bg} ${style.text} flex items-center gap-1`}>
                    {style.dot} GRAVIDADE {style.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">PROTOCOLO: CODD-{ticket.id}</span>
                </div>
                
                <div>
                  <h4 className="font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase text-lg leading-tight">{ticket.subject}</h4>
                  <p className="text-xs text-slate-500 font-medium uppercase mt-2 line-clamp-2 italic">"{ticket.description}"</p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase border-t border-slate-50 pt-3">
                  <span className="flex items-center gap-1">📅 {new Date(ticket.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">⏰ {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>

              <div className="mt-6 md:mt-0 w-full md:w-auto">
                <button className="w-full md:w-auto px-8 py-3 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest shadow-sm">
                  Abrir Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
