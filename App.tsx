
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-32">
      <ChatWidget />
      
      {/* SOS Header */}
      <header className="bg-[#E63946] text-black pt-10 pb-10 px-8 shadow-2xl rounded-b-[50px] mb-10 relative overflow-hidden">
        <div className="absolute top-20 -left-10 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="text-black font-black text-[12px] tracking-[0.2em] uppercase">Prevenção de Perdas</div>
          <div className="text-black text-xs font-bold opacity-70 tracking-widest uppercase">{new Date().toLocaleDateString('pt-BR')}</div>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
              Central de <br/><span className="text-yellow-400">Ocorrências</span>
            </h1>
          </div>
          
          <img 
            src="https://i.ibb.co/vzB7pG0/logo.png" 
            alt="Logo" 
            className="w-24 h-24 object-contain drop-shadow-2xl"
          />
        </div>
      </header>

      <main className="px-2">
        {activeTab === Tab.NEW_CLAIM ? (
          <ClaimWizard onSuccess={handleSuccess} />
        ) : activeTab === Tab.HISTORY ? (
          <Dashboard viewMode="cards" />
        ) : (
          <Dashboard viewMode="table" />
        )}
      </main>

      {/* Floating Navbar */}
      <nav className="fixed bottom-6 left-4 right-4 bg-black/95 backdrop-blur-xl text-white px-2 py-4 flex justify-around items-center z-50 rounded-[35px] shadow-2xl border border-white/10">
        <button 
          onClick={() => setActiveTab(Tab.NEW_CLAIM)}
          className={`flex flex-col items-center gap-1 transition-all px-6 py-2 rounded-2xl ${activeTab === Tab.NEW_CLAIM ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500'}`}
        >
          <span className="text-xl">🚨</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Aviso</span>
        </button>
        
        <button 
          onClick={() => setActiveTab(Tab.HISTORY)}
          className={`flex flex-col items-center gap-1 transition-all px-6 py-2 rounded-2xl ${activeTab === Tab.HISTORY ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500'}`}
        >
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Histórico</span>
        </button>

        <button 
          onClick={() => setActiveTab(Tab.DATABASE)}
          className={`flex flex-col items-center gap-1 transition-all px-6 py-2 rounded-2xl ${activeTab === Tab.DATABASE ? 'bg-red-600 text-white shadow-xl' : 'text-slate-500'}`}
        >
          <span className="text-xl">🗄️</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Gestão DB</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
