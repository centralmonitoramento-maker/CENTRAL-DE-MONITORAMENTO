
import React, { useState } from 'react';
import { TicketFormData, TicketCategory, TicketPriority } from '../types';
import { zendeskService } from '../services/zendeskService';
import { GoogleGenAI, Type } from "@google/genai";

const TicketForm: React.FC<{ onSuccess: (id: number) => void }> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [formData, setFormData] = useState<TicketFormData>({
    requester_name: '',
    requester_email: '',
    policy_number: '',
    occurrence_date: '',
    subject: '',
    description: '',
    category: TicketCategory.AUTO,
    priority: TicketPriority.NORMAL,
    is_emergency: false,
    license_plate: '',
    property_address: ''
  });

  const analyzeClaim = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || formData.description.length < 15) return;
    
    setAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é um triador de sinistros de seguros. Analise este relato e extraia a categoria e prioridade.
      Relato: "${formData.description}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categoria: {
                type: Type.STRING,
                description: 'A categoria do sinistro: automovel, residencial, vida, saude',
              },
              prioridade: {
                type: Type.STRING,
                description: 'A prioridade: low, normal, high, urgent.',
              },
            },
            required: ['categoria', 'prioridade'],
          }
        }
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        if (result.categoria) setFormData(prev => ({ ...prev, category: result.categoria as TicketCategory }));
        if (result.prioridade) setFormData(prev => ({ ...prev, priority: result.prioridade as TicketPriority }));
      }
    } catch (e) {
      console.warn("IA não configurada ou erro na análise", e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await zendeskService.createTicket(formData);
    setLoading(false);
    if (res.success && res.data) {
      onSuccess(res.data.id);
    } else {
      alert(res.error || 'Erro ao processar sinistro.');
    }
  };

  const commonInputClasses = "w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold uppercase";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Aviso de Sinistro</h2>
      <p className="text-slate-500 text-sm mb-6">Preencha os dados abaixo para qualificação antecipada do seu processo.</p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Segurado</label>
            <input
              type="text" required
              className={commonInputClasses}
              value={formData.requester_name}
              onChange={e => setFormData({ ...formData, requester_name: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nº da Apólice</label>
            <input
              type="text" required
              className={commonInputClasses}
              value={formData.policy_number}
              onChange={e => setFormData({ ...formData, policy_number: e.target.value.toUpperCase() })}
              placeholder="Ex: AP-998877"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Sinistro</label>
            <select
              className={`${commonInputClasses} font-bold uppercase`}
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as TicketCategory })}
            >
              <option value={TicketCategory.AUTO}>Automóvel</option>
              <option value={TicketCategory.RESIDENTIAL}>Residencial</option>
              <option value={TicketCategory.HEALTH}>Saúde</option>
              <option value={TicketCategory.LIFE}>Vida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Data do Ocorrido</label>
            <input
              type="date" required
              className={commonInputClasses}
              value={formData.occurrence_date}
              onChange={e => setFormData({ ...formData, occurrence_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição do Evento</label>
          <textarea
            required rows={3}
            className={commonInputClasses}
            value={formData.description}
            onBlur={analyzeClaim}
            onChange={e => setFormData({ ...formData, description: e.target.value.toUpperCase() })}
            placeholder="Relate o ocorrido com o máximo de detalhes..."
          />
          {aiAnalyzing && <p className="text-xs text-blue-600 mt-1 animate-pulse">🤖 IA analisando gravidade do sinistro...</p>}
        </div>

        {formData.category === TicketCategory.AUTO && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in zoom-in duration-300">
            <label className="block text-sm font-semibold text-blue-700 mb-1">Placa do Veículo</label>
            <input
              type="text" required
              className={`${commonInputClasses} border-blue-200`}
              value={formData.license_plate}
              onChange={e => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
              placeholder="Ex: ABC-1234"
            />
          </div>
        )}

        {formData.category === TicketCategory.RESIDENTIAL && (
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 animate-in fade-in zoom-in duration-300">
            <label className="block text-sm font-semibold text-orange-700 mb-1">Endereço do Imóvel</label>
            <input
              type="text" required
              className={`${commonInputClasses} border-orange-200`}
              value={formData.property_address}
              onChange={e => setFormData({ ...formData, property_address: e.target.value.toUpperCase() })}
              placeholder="Rua, Número, Bairro, Cidade"
            />
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <input
            type="checkbox" id="is_emergency"
            className="w-4 h-4 text-red-600 rounded"
            checked={formData.is_emergency}
            onChange={e => setFormData({ ...formData, is_emergency: e.target.checked })}
          />
          <label htmlFor="is_emergency" className="text-sm font-bold text-red-700 uppercase">Há feridos ou necessidade de guincho imediato?</label>
        </div>

        <button
          type="submit" disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-bold text-lg transition-all ${
            loading ? 'bg-slate-400' : 'bg-[#102a43] hover:bg-[#243b53] shadow-lg active:scale-[0.98] uppercase'
          }`}
        >
          {loading ? 'Enviando Aviso...' : 'Confirmar Aviso de Sinistro'}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
