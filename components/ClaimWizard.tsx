
import React, { useState } from 'react';
import { ClaimWizardData, ClaimantType, OccurrenceCategory, GravityLevel, InvolvedParty } from '../types';
import { zendeskService } from '../services/zendeskService';
import { formatWhatsAppSummary } from '../server/middleware';

interface WizardProps {
  onSuccess: (id: number, summary: string) => void;
}

interface FileProgress {
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  token?: string;
}

const ClaimWizard: React.FC<WizardProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileProgress>>({});
  
  const [currentInvolved, setCurrentInvolved] = useState<InvolvedParty>({
    type: ClaimantType.CLIENT,
    name: '',
    cpf: '',
    phone: ''
  });

  const [data, setData] = useState<ClaimWizardData>({
    branch: '',
    occurrence_date: new Date().toISOString().split('T')[0],
    occurrence_time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }),
    requester_name: '',
    requester_role: '',
    involved_parties: [],
    requester_email: 'usuario@empresa.com',
    category: OccurrenceCategory.NONE,
    gravity: GravityLevel.MEDIUM,
    location: '',
    description: '',
    vehicle_plate: '',
    vehicle_brand: '',
    vehicle_color: '',
    invoice_number: '',
    cash_value: '',
    files: [],
    uploadTokens: []
  });

  const branches = [
    "CA", "01 BRR 070", "04 SOBRADINHO", "07 SIA", "08 TAGUATINGA", "12 GAMA", "13 LUZIANIA", "15 BALNEARIO", 
    "16 SANTO ANTONIO", "17 CD", "18 AGUAS LINDAS", "19 CALDAS NOVAS", "21 CEILANDIA SUL", "22 CA", 
    "25 NOVO GAMA", "26 CESAR LATTES", "27 PLANALTINA GO", "28 AGUA CLARAS", "29 GUARA", "30 LEM", 
    "32 CEILADIA CENTRO", "33 PLANALDINA DF", "34 SAMABAIA SUL", "37 VICENTE RUA 012", "38 VICENTE RUA 04", 
    "39 GOIANESIA", "40 GURUPI", "42 JARDIM BOTANICO", "47 AP. GOIANAIA", "50 MESTRE DARMAS", "53 RIO VERDE", 
    "55 RECANTO DAS EMAS", "56 RIACHO", "58 ETPG", "60 FURNAS", "62 LUZIANAIA 2", "63 FORMOSA", "64 ITUBIARA"
  ];

  const addInvolved = () => {
    if (!currentInvolved.name) {
      alert("Por favor, informe ao menos o nome do envolvido.");
      return;
    }
    setData(prev => ({
      ...prev,
      involved_parties: [...prev.involved_parties, currentInvolved]
    }));
    setCurrentInvolved({
      type: ClaimantType.CLIENT,
      name: '',
      cpf: '',
      phone: ''
    });
  };

  const removeInvolved = (index: number) => {
    setData(prev => ({
      ...prev,
      involved_parties: prev.involved_parties.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (step === 1 && !data.branch) {
      alert("Selecione a filial da ocorrência.");
      return;
    }
    if (step === 2 && !data.requester_name) {
      alert("Informe o nome do solicitante.");
      return;
    }
    if (step === 3) {
      if (data.category === OccurrenceCategory.NONE) {
        alert("Selecione o tipo de evento.");
        return;
      }
      if (!data.location || !data.description) {
        alert("Preencha o local e a descrição da ocorrência.");
        return;
      }
      if (data.category === OccurrenceCategory.COLLISION) {
        if (!data.vehicle_plate || !data.vehicle_brand || !data.vehicle_color) {
          alert("Para colisões, os dados do veículo são obrigatórios.");
          return;
        }
      }
      if (data.category === OccurrenceCategory.RECEIPT && !data.invoice_number) {
        alert("Para recebimentos, o número da nota fiscal é obrigatório.");
        return;
      }
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setData(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));

      selectedFiles.forEach(async (file) => {
        const fileId = `${file.name}-${Date.now()}`;
        
        setFileStatuses(prev => ({
          ...prev,
          [fileId]: { name: file.name, progress: 0, status: 'uploading' }
        }));

        const result = await zendeskService.uploadFile(file, (p) => {
          setFileStatuses(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress: p }
          }));
        });

        if (result.success && result.data) {
          setFileStatuses(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], progress: 100, status: 'success', token: result.data!.token }
          }));
          setData(prev => ({
            ...prev,
            uploadTokens: [...prev.uploadTokens, result.data!.token]
          }));
        } else {
          setFileStatuses(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], status: 'error', progress: 100 }
          }));
        }
      });
    }
  };

  const handleSubmit = async () => {
    const isUploading = Object.values(fileStatuses).some(f => f.status === 'uploading');
    if (isUploading) {
      alert("Aguarde o término do envio dos anexos.");
      return;
    }

    setLoading(true);
    const res = await zendeskService.createTicket(data as any);
    setLoading(false);
    
    if (res.success && res.data) {
      const summary = formatWhatsAppSummary(data, res.data.id);
      onSuccess(res.data.id, summary);
    } else {
      alert("Erro ao registrar ocorrência.");
    }
  };

  const renderStep = () => {
    const inputClasses = "w-full p-4 bg-[#f8f9fa] rounded-2xl outline-none focus:ring-2 focus:ring-red-600 border border-slate-200 focus:border-red-600 transition-all text-black font-semibold placeholder:text-slate-400 uppercase";
    const selectClasses = "w-full p-4 bg-[#f8f9fa] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 border border-slate-200 text-black font-bold appearance-none cursor-pointer uppercase";

    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-bold text-red-600 uppercase border-b-2 border-yellow-400 pb-2">Passo 1: Qualificação Inicial</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filial / Unidade:</label>
              <div className="relative">
                <select
                  className={selectClasses}
                  value={data.branch}
                  onChange={e => setData({...data, branch: e.target.value})}
                >
                  <option value="">Selecione a Unidade...</option>
                  {branches.map((branch, index) => (
                    <option key={index} value={branch}>{branch}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black">▼</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data:</label>
                <input
                  type="date"
                  className={inputClasses}
                  value={data.occurrence_date}
                  onChange={e => setData({...data, occurrence_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Horário:</label>
                <input
                  type="time"
                  className={inputClasses}
                  value={data.occurrence_time}
                  onChange={e => setData({...data, occurrence_time: e.target.value})}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div>
              <h3 className="text-lg font-bold text-red-600 uppercase border-b-2 border-yellow-400 pb-2 mb-4">Passo 2: Solicitante e Envolvidos</h3>
              <div className="p-4 bg-slate-100 rounded-3xl border-2 border-slate-200 space-y-4 mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase text-center">Identificação do Solicitante</p>
                <div className="space-y-3">
                  <input
                    className={inputClasses}
                    placeholder="Nome do Solicitante"
                    value={data.requester_name}
                    onChange={e => setData({...data, requester_name: e.target.value.toUpperCase()})}
                  />
                  <input
                    className={inputClasses}
                    placeholder="Função / Cargo"
                    value={data.requester_role}
                    onChange={e => setData({...data, requester_role: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            </div>

            {data.involved_parties.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Envolvidos na Lista:</p>
                {data.involved_parties.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-900 rounded-xl text-white">
                    <div className="text-xs">
                      <p className="font-black text-yellow-400 uppercase">{p.type}</p>
                      <p className="font-bold">{p.name}</p>
                    </div>
                    <button onClick={() => removeInvolved(idx)} className="text-red-400 text-lg p-2">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-2 border-slate-100 rounded-3xl bg-slate-50/50 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase text-center">Adicionar Outros Envolvidos</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Qualificação:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: ClaimantType.CLIENT, label: 'Cliente' },
                    { id: ClaimantType.EMPLOYEE, label: 'Colaborador' },
                    { id: ClaimantType.THIRD_PARTY, label: 'Terceiro' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCurrentInvolved({ ...currentInvolved, type: t.id })}
                      className={`py-3 px-1 text-[10px] font-black rounded-xl border-2 transition-all ${
                        currentInvolved.type === t.id 
                        ? 'bg-[#f8f9fa] border-red-600 text-red-600 shadow-md scale-105' 
                        : 'bg-white border-slate-100 text-slate-400'
                      }`}
                    >
                      {t.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className={inputClasses}
                placeholder="Nome Completo"
                value={currentInvolved.name}
                onChange={e => setCurrentInvolved({...currentInvolved, name: e.target.value.toUpperCase()})}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputClasses}
                  placeholder="CPF/CNPJ"
                  value={currentInvolved.cpf}
                  onChange={e => setCurrentInvolved({...currentInvolved, cpf: e.target.value.toUpperCase()})}
                />
                <input
                  className={inputClasses}
                  placeholder="Telefone"
                  value={currentInvolved.phone}
                  onChange={e => setCurrentInvolved({...currentInvolved, phone: e.target.value.toUpperCase()})}
                />
              </div>
              <button 
                type="button"
                onClick={addInvolved}
                className="w-full py-3 bg-slate-800 text-yellow-400 font-black rounded-2xl text-[10px] uppercase tracking-widest"
              >
                + Adicionar à Lista
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-bold text-red-600 uppercase border-b-2 border-yellow-400 pb-2">Passo 3: Ocorrência</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Evento:</label>
              <div className="relative">
                <select
                  className={selectClasses}
                  value={data.category}
                  onChange={e => {
                    const val = e.target.value as OccurrenceCategory;
                    setData({
                      ...data, 
                      category: val,
                      vehicle_plate: val === OccurrenceCategory.COLLISION ? data.vehicle_plate : '',
                      vehicle_brand: val === OccurrenceCategory.COLLISION ? data.vehicle_brand : '',
                      vehicle_color: val === OccurrenceCategory.COLLISION ? data.vehicle_color : '',
                      invoice_number: val === OccurrenceCategory.RECEIPT ? data.invoice_number : '',
                      cash_value: val === OccurrenceCategory.CASH_SHORTAGE ? data.cash_value : ''
                    });
                  }}
                >
                  <option value={OccurrenceCategory.NONE}>Selecione o tipo...</option>
                  <option value={OccurrenceCategory.COLLISION}>Colisão</option>
                  <option value={OccurrenceCategory.THEFT}>Furto</option>
                  <option value={OccurrenceCategory.TASTING}>Degustação</option>
                  <option value={OccurrenceCategory.MISCONDUCT}>Mau Procedimento</option>
                  <option value={OccurrenceCategory.SUDDEN_ILLNESS}>Mau Súbito</option>
                  <option value={OccurrenceCategory.ACCIDENT}>Acidente</option>
                  <option value={OccurrenceCategory.CONFLICT}>Conflito</option>
                  <option value={OccurrenceCategory.RECEIPT}>Recebimento</option>
                  <option value={OccurrenceCategory.CASH_SHORTAGE}>Quebra de Caixa</option>
                  <option value={OccurrenceCategory.INSPECTION}>Fiscalização</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-black font-black">▼</div>
              </div>
            </div>

            {data.category === OccurrenceCategory.COLLISION && (
              <div className="p-4 bg-red-50 rounded-3xl border-2 border-red-100 space-y-3 animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] font-black text-red-500 uppercase text-center">Dados do Veículo Envolvido</p>
                <input
                  className={`${inputClasses} border-red-200 focus:ring-red-600`}
                  placeholder="Placa do Veículo"
                  value={data.vehicle_plate}
                  onChange={e => setData({...data, vehicle_plate: e.target.value.toUpperCase()})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={`${inputClasses} border-red-200 focus:ring-red-600`}
                    placeholder="Marca / Modelo"
                    value={data.vehicle_brand}
                    onChange={e => setData({...data, vehicle_brand: e.target.value.toUpperCase()})}
                  />
                  <input
                    className={`${inputClasses} border-red-200 focus:ring-red-600`}
                    placeholder="Cor"
                    value={data.vehicle_color}
                    onChange={e => setData({...data, vehicle_color: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
            )}

            {data.category === OccurrenceCategory.RECEIPT && (
              <div className="p-4 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-3 animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] font-black text-blue-500 uppercase text-center">Dados do Recebimento</p>
                <input
                  className={`${inputClasses} border-blue-200 focus:ring-blue-600`}
                  placeholder="Número da Nota Fiscal"
                  value={data.invoice_number}
                  onChange={e => setData({...data, invoice_number: e.target.value.toUpperCase()})}
                />
              </div>
            )}

            {data.category === OccurrenceCategory.CASH_SHORTAGE && (
              <div className="p-4 bg-yellow-50 rounded-3xl border-2 border-yellow-100 space-y-3 animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] font-black text-yellow-600 uppercase text-center">Dados Financeiros</p>
                <input
                  className={`${inputClasses} border-yellow-200 focus:ring-yellow-600`}
                  placeholder="Valor do Faltante (R$)"
                  value={data.cash_value}
                  onChange={e => setData({...data, cash_value: e.target.value.toUpperCase()})}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gravidade (Nível de Prioridade):</label>
              <div className="flex justify-between items-center gap-4 bg-slate-900 p-4 rounded-[30px] shadow-inner">
                <button
                  type="button"
                  onClick={() => setData({...data, gravity: GravityLevel.LOW})}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${
                    data.gravity === GravityLevel.LOW 
                    ? 'bg-green-500 text-white scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                    : 'bg-slate-800 text-slate-500 grayscale opacity-40'
                  }`}
                >
                  <span className="text-xl">🟢</span>
                  <span className="text-[9px] font-black uppercase">Leve</span>
                </button>

                <button
                  type="button"
                  onClick={() => setData({...data, gravity: GravityLevel.MEDIUM})}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${
                    data.gravity === GravityLevel.MEDIUM 
                    ? 'bg-yellow-400 text-black scale-105 shadow-[0_0_20px_rgba(250,204,21,0.4)]' 
                    : 'bg-slate-800 text-slate-500 grayscale opacity-40'
                  }`}
                >
                  <span className="text-xl">🟡</span>
                  <span className="text-[9px] font-black uppercase">Média</span>
                </button>

                <button
                  type="button"
                  onClick={() => setData({...data, gravity: GravityLevel.HIGH})}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all duration-300 ${
                    data.gravity === GravityLevel.HIGH 
                    ? 'bg-red-600 text-white scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                    : 'bg-slate-800 text-slate-500 grayscale opacity-40'
                  }`}
                >
                  <span className="text-xl">🔴</span>
                  <span className="text-[9px] font-black uppercase">Crítica</span>
                </button>
              </div>
            </div>

            <input
              className={inputClasses}
              placeholder="Local Específico (ex: Setor A, Estacionamento)"
              value={data.location}
              onChange={e => setData({...data, location: e.target.value.toUpperCase()})}
            />
            <textarea
              className={`${inputClasses} resize-none`}
              placeholder="Descreva o que aconteceu..."
              rows={4}
              value={data.description}
              onChange={e => setData({...data, description: e.target.value.toUpperCase()})}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-bold text-red-600 uppercase border-b-2 border-yellow-400 pb-2">Passo 4: Evidências</h3>
            <div className="border-4 border-dashed border-slate-200 rounded-3xl p-10 text-center bg-[#f8f9fa] hover:bg-slate-100 transition-colors shadow-inner group">
              <input type="file" multiple id="file-upload" className="hidden" onChange={handleFileChange} />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="text-red-500 text-5xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                <p className="text-sm font-black text-slate-600 uppercase">Anexar Provas</p>
                <p className="text-xs text-slate-400 mt-2">Fotos ou Documentos</p>
                <div className="inline-block mt-4 px-6 py-2 bg-yellow-400 text-black text-[10px] font-black rounded-full shadow-md active:scale-95 transition-all">CLIQUE PARA ADICIONAR</div>
              </label>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-4 px-1 mt-6 custom-scrollbar">
              {Object.entries(fileStatuses).length === 0 && (
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase italic mt-4 opacity-50">Nenhum arquivo selecionado</p>
              )}
              {Object.entries(fileStatuses).map(([id, status]) => (
                <div key={id} className="bg-white p-4 rounded-[25px] border-2 border-slate-100 flex flex-col gap-3 shadow-md animate-in slide-in-from-left duration-500">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="text-lg">
                        {status.status === 'success' ? '📄' : status.status === 'error' ? '❌' : '⏳'}
                      </span>
                      <span className="truncate text-slate-800">{status.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                      status.status === 'success' ? 'bg-green-100 text-green-700' : 
                      status.status === 'error' ? 'bg-red-100 text-red-700' : 
                      'bg-slate-100 text-slate-500 animate-pulse'
                    }`}>
                      {status.status === 'success' ? 'CONCLUÍDO' : status.status === 'error' ? 'FALHA' : `${status.progress}%`}
                    </span>
                  </div>
                  
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                    <div 
                      className={`h-full transition-all duration-700 ease-out relative ${
                        status.status === 'success' ? 'bg-green-500' : 
                        status.status === 'error' ? 'bg-red-500' : 
                        'bg-red-600'
                      }`}
                      style={{ width: `${status.progress}%` }}
                    >
                      {status.status === 'uploading' && (
                        <div className="absolute inset-0 bg-white/30 animate-[pulse_1s_infinite]"></div>
                      )}
                      {status.status === 'success' && (
                        <div className="absolute inset-0 bg-white/10 flex items-center justify-end pr-1">
                          <span className="text-[7px] text-white">✨</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-50">
      <div className="h-3 bg-slate-100 flex">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex-1 transition-all duration-700 ${step >= i ? 'bg-red-600' : ''}`} />
        ))}
      </div>

      <div className="p-8">
        {renderStep()}

        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-3xl active:scale-90 transition uppercase text-xs">Voltar</button>
          )}
          
          {step < 4 ? (
            <button onClick={nextStep} className="flex-[2] py-5 bg-yellow-400 text-black font-black rounded-3xl shadow-xl active:scale-95 transition uppercase text-xs tracking-widest">Continuar</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className={`flex-[2] py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl active:scale-95 transition uppercase text-xs tracking-widest ${loading ? 'opacity-50' : ''}`}>
              {loading ? 'Processando...' : 'Finalizar Registro'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimWizard;
