
import { TicketFormData, ClaimWizardData, ZendeskTicket, ServerResponse, TicketNotification } from '../types';
import { mapTicketToZendesk } from '../server/middleware';

const DB_KEY = 'sos_pro_occurrence_db';

// Função auxiliar para gerenciar o "Banco de Dados" local
const getStoredTickets = (): ZendeskTicket[] => {
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveTicketToDB = (ticket: ZendeskTicket) => {
  const tickets = getStoredTickets();
  const updated = [ticket, ...tickets];
  localStorage.setItem(DB_KEY, JSON.stringify(updated));
};

export const zendeskService = {
  createTicket: async (data: TicketFormData | ClaimWizardData): Promise<ServerResponse<{ id: number }>> => {
    try {
      const zendeskPayload = mapTicketToZendesk(data);
      const id = Math.floor(Math.random() * 900000) + 100000;
      
      // Simulação de persistência no "Banco de Dados"
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
        attachments: (data as any).uploadTokens?.map(() => "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=400") || []
      };

      saveTicketToDB(newTicket);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        success: true,
        data: { id },
        message: 'Ocorrência registrada e salva no banco de dados!'
      };
    } catch (error) {
      return { success: false, error: 'Erro ao processar sua solicitação.' };
    }
  },

  uploadFile: async (file: File, onProgress: (percent: number) => void): Promise<ServerResponse<{ token: string }>> => {
    try {
      for (let i = 0; i <= 100; i += 25) {
        onProgress(i);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      return {
        success: true,
        data: { token: `upload-token-${Math.random().toString(36).substr(2, 9)}` }
      };
    } catch (error) {
      return { success: false, error: 'Falha no upload do arquivo.' };
    }
  },

  getNotifications: async (): Promise<ServerResponse<TicketNotification[]>> => {
    try {
      const mockNotifications: TicketNotification[] = [
        {
          id: '1',
          ticketId: 45678,
          message: 'Novo sinistro registrado na Unidade SIA.',
          type: 'new_comment',
          timestamp: new Date().toISOString(),
          read: false
        }
      ];
      return { success: true, data: mockNotifications };
    } catch (e) {
      return { success: false, error: 'Erro ao carregar notificações.' };
    }
  },

  getTicketById: async (protocol: string): Promise<ServerResponse<ZendeskTicket[]>> => {
    try {
      const numericId = parseInt(protocol.replace(/[^0-9]/g, ''));
      const tickets = getStoredTickets();
      const found = tickets.find(t => t.id === numericId);
      
      if (found) return { success: true, data: [found] };
      
      throw new Error("Não encontrado");
    } catch (error) {
      return { success: false, error: 'Ocorrência não localizada no banco.' };
    }
  },

  getRecentTickets: async (): Promise<ServerResponse<ZendeskTicket[]>> => {
    try {
      const stored = getStoredTickets();
      // Se estiver vazio, popula com mocks iniciais para demonstração
      if (stored.length === 0) {
        const mockTickets: ZendeskTicket[] = [
          {
            id: 100456,
            subject: '[SIA] COLISÃO - DOCA 02',
            status: 'open',
            priority: 'high',
            created_at: new Date().toISOString(),
            description: 'Colisão lateral entre caminhão de frota e estrutura da doca.',
            branch: '07 SIA',
            location: 'Doca 02',
            category: 'colisao',
            requester_name: 'JOÃO GESTOR',
            attachments: []
          }
        ];
        localStorage.setItem(DB_KEY, JSON.stringify(mockTickets));
        return { success: true, data: mockTickets };
      }
      return { success: true, data: stored };
    } catch (error) {
      return { success: false, error: 'Erro ao carregar banco de dados.' };
    }
  }
};
