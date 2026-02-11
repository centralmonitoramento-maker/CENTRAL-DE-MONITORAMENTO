
import { TicketFormData, ClaimWizardData, ZendeskTicket, ServerResponse, TicketNotification } from '../types';
import { mapTicketToZendesk } from '../server/middleware';

const DB_KEY = 'sos_pro_occurrence_db';

// Motor de persistência local para GitHub Pages
const getStoredTickets = (): ZendeskTicket[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveTicketToDB = (ticket: ZendeskTicket) => {
  if (typeof window === 'undefined') return;
  const tickets = getStoredTickets();
  const updated = [ticket, ...tickets];
  localStorage.setItem(DB_KEY, JSON.stringify(updated));
};

export const zendeskService = {
  createTicket: async (data: TicketFormData | ClaimWizardData): Promise<ServerResponse<{ id: number }>> => {
    try {
      const zendeskPayload = mapTicketToZendesk(data);
      const id = Math.floor(Math.random() * 900000) + 100000;
      
      const newTicket: ZendeskTicket = {
        id: id,
        subject: zendeskPayload.ticket.subject,
        status: 'new',
        priority: zendeskPayload.ticket.priority,
        created_at: new Date().toISOString(),
        description: data.description,
        branch: (data as any).branch || 'N/A',
        location: (data as any).location || 'N/A',
        category: data.category,
        requester_name: data.requester_name,
        attachments: (data as any).uploadTokens?.map((t: string) => "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=400") || []
      };

      saveTicketToDB(newTicket);
      
      return {
        success: true,
        data: { id },
        message: 'Ocorrência registrada no Banco de Dados Local!'
      };
    } catch (error) {
      return { success: false, error: 'Erro ao processar sua solicitação.' };
    }
  },

  uploadFile: async (file: File, onProgress: (percent: number) => void): Promise<ServerResponse<{ token: string }>> => {
    try {
      for (let i = 0; i <= 100; i += 25) {
        onProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return {
        success: true,
        data: { token: `upload-${Date.now()}` }
      };
    } catch (error) {
      return { success: false, error: 'Falha no upload.' };
    }
  },

  getRecentTickets: async (): Promise<ServerResponse<ZendeskTicket[]>> => {
    try {
      const stored = getStoredTickets();
      return { success: true, data: stored };
    } catch (error) {
      return { success: false, error: 'Erro ao carregar banco de dados.' };
    }
  },

  getTicketById: async (protocol: string): Promise<ServerResponse<ZendeskTicket[]>> => {
    try {
      const numericId = parseInt(protocol.replace(/[^0-9]/g, ''));
      const tickets = getStoredTickets();
      const found = tickets.find(t => t.id === numericId);
      return found ? { success: true, data: [found] } : { success: false, error: 'Não encontrado' };
    } catch (error) {
      return { success: false, error: 'Erro na busca.' };
    }
  },

  getNotifications: async (): Promise<ServerResponse<TicketNotification[]>> => {
    return { success: true, data: [] };
  }
};
