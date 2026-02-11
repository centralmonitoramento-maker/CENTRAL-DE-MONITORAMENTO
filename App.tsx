
import React, { useState } from 'react';
import ClaimWizard from './components/ClaimWizard';
import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';

enum Tab {
  NEW_CLAIM = 'new',
  HISTORY = 'history',
  DATABASE = 'database'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.NEW_CLAIM);
  const [successData, setSuccessData] = useState<{id: number, summary: string} | null>(null);

  const handleSuccess = (id: number, summary: string) => {
    setSuccessData({ id, summary });
    setActiveTab(Tab.HISTORY);
  };

  const copyToWhatsApp = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.summary);
      alert("Resumo copiado com sucesso!");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32">
      <ChatWidget />
      
      {/* SOS Header */}
      <header className="bg-[#E63946] text-black pt-10 pb-10 px-8 shadow-2xl rounded-b-[50px] mb-10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full"></div>
        <div className="absolute top-20 -left-10 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="text-black font-black text-[12px] tracking-[0.2em] uppercase drop-shadow-sm">Prevenção de Perdas</div>
          <div className="text-black text-xs font-bold opacity-70 tracking-widest">{new Date().toLocaleDateString('pt-BR')}</div>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
              Central de <br/><span className="text-yellow-400">Ocorrências</span>
            </h1>
          </div>
          
          {/* Logo Prevenção de Perdas - DD */}
          <div className="relative group ml-4">
            <div className="absolute -inset-2 bg-white rounded-full opacity-0 group-hover:opacity-10 transition duration-500 blur-xl"></div>
            <img 
              src="https://i.ibb.co/vzB7pG0/logo.png" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/9322/9322127.png";
              }}
              alt="Logo Prevenção de Perdas" 
              className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)] animate-in zoom-in duration-500 hover:scale-110 transition-transform cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="px-5">
        {successData && activeTab === Tab.HISTORY && (
          <div className="bg-green-600 text-black p-8 rounded-[40px] mb-10 shadow-2xl animate-in fade-in zoom-in duration-700">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-black leading-none">Protocolo<br/>CODD-{successData.id}</h2>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-xs font-bold opacity-80 mb-6 leading-relaxed uppercase">Ocorrência registrada e salva no banco de dados com sucesso.</p>
            <button 
              onClick={copyToWhatsApp}
              className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition shadow-lg text-xs"
            >
              📲 COPIAR RESUMO WHATSAPP
            </button>
          </div>
        )}

        {activeTab === Tab.NEW_CLAIM ? (
          <ClaimWizard onSuccess={handleSuccess} />
        ) : activeTab === Tab.HISTORY ? (
          <Dashboard viewMode="cards" />
        ) : (
          <Dashboard viewMode="table" />
        )}
      </main>

      {/* Modern Floating Navbar */}
      <nav className="fixed bottom-6 left-6 right-6 bg-slate-900 text-white px-4 py-4 flex justify-between items-center z-50 rounded-[35px] shadow-2xl border border-white/10">
        <button 
          onClick={() => setActiveTab(Tab.NEW_CLAIM)}
          className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${
            activeTab === Tab.NEW_CLAIM 
            ? 'bg-red-600 text-white scale-105 shadow-xl' 
            : 'text-slate-500'
          }`}
        >
          <span className="text-xl">🚨</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">Aviso</span>
        </button>
        
        <button 
          onClick={() => setActiveTab(Tab.HISTORY)}
          className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${
            activeTab === Tab.HISTORY 
            ? 'bg-red-600 text-white scale-105 shadow-xl' 
            : 'text-slate-500'
          }`}
        >
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">Histórico</span>
        </button>

        <button 
          onClick={() => setActiveTab(Tab.DATABASE)}
          className={`flex flex-col items-center gap-1 transition-all px-4 py-2 rounded-2xl ${
            activeTab === Tab.DATABASE 
            ? 'bg-red-600 text-white scale-105 shadow-xl' 
            : 'text-slate-500'
          }`}
        >
          <span className="text-xl">🗄️</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">Gestão DB</span>
        </button>

        <button 
          onClick={() => (window as any).zE?.('messenger', 'open')}
          className="flex flex-col items-center gap-1 text-slate-500 px-4 py-2"
        >
          <span className="text-xl">💬</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">Suporte</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
