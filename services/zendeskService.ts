
import { TicketFormData, ClaimWizardData, ZendeskTicket, ServerResponse, TicketNotification } from '../types';
import { mapTicketToZendesk } from '../server/middleware';

/**
 * This service communicates with our backend.
 * Backend should handle the ACTUAL Zendesk API calls.
 */
export const zendeskService = {
  // Accepts TicketFormData or ClaimWizardData (aliased as any via mapTicketToZendesk)
  createTicket: async (data: TicketFormData | ClaimWizardData): Promise<ServerResponse<{ id: number }>> => {
    try {
      // Logic from server/middleware.ts is what would happen on the server
      const zendeskPayload = mapTicketToZendesk(data);
      console.log('Backend sending to Zendesk:', zendeskPayload);

      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mocking a successful response from Zendesk through our backend
      return {
        success: true,
        data: { id: Math.floor(Math.random() * 900000) + 100000 },
        message: 'Ticket criado com sucesso no Zendesk!'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao processar sua solicitação.'
      };
    }
  },

  uploadFile: async (file: File, onProgress: (percent: number) => void): Promise<ServerResponse<{ token: string }>> => {
    try {
      // Simulação de progresso de upload (Comportamento esperado pela API /uploads.json)
      for (let i = 0; i <= 100; i += 25) {
        onProgress(i);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      return {
        success: true,
        data: { token: `upload-token-${Math.random().toString(36).substr(2, 9)}` }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Falha no upload do arquivo.'
      };
    }
  },

  getNotifications: async (): Promise<ServerResponse<TicketNotification[]>> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockNotifications: TicketNotification[] = [
        {
          id: '1',
          ticketId: 45678,
          message: 'Um agente respondeu ao seu ticket de falha no login.',
          type: 'new_comment',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          read: false
        },
        {
          id: '2',
          ticketId: 45612,
          message: 'O status do seu ticket de faturamento foi alterado para RESOLVIDO.',
          type: 'status_change',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: true
        },
        {
          id: '3',
          ticketId: 100234,
          message: 'ALERTA: Sua ocorrência foi marcada como prioridade urgente.',
          type: 'urgent_alert',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
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
      // Extract numeric ID from strings like "CODD-12345"
      const numericId = protocol.replace(/[^0-9]/g, '');
      if (!numericId) throw new Error("ID inválido");

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mocking a search result based on the ID provided
      const idNum = parseInt(numericId);
      const mockTicket: ZendeskTicket = {
        id: idNum,
        subject: `[CODD-${idNum}] Ocorrência Registrada`,
        status: idNum % 4 === 0 ? 'solved' : (idNum % 3 === 0 ? 'pending' : 'open'),
        // Simulate priority mapping for visual gravity logic
        priority: idNum % 3 === 0 ? 'high' : (idNum % 2 === 0 ? 'normal' : 'low'),
        created_at: new Date(Date.now() - 3600000).toISOString(),
        description: 'Relato detalhado da ocorrência conforme registrado no sistema de atendimento CODD.'
      };

      return {
        success: true,
        data: [mockTicket]
      };
    } catch (error) {
      return {
        success: false,
        error: 'Ticket não localizado ou formato de protocolo inválido.'
      };
    }
  },

  listTicketsByEmail: async (email: string): Promise<ServerResponse<ZendeskTicket[]>> => {
    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock tickets that would come from Zendesk search API
      const mockTickets: ZendeskTicket[] = [
        {
          id: 45678,
          subject: '[SISTEMA] Falha no login principal',
          status: 'open',
          priority: 'high',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          description: 'Não consigo acessar a dashboard.'
        },
        {
          id: 45612,
          subject: '[GERAL] Dúvida sobre faturamento',
          status: 'solved',
          priority: 'normal',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          description: 'Quando vence a próxima fatura?'
        }
      ];

      return {
        success: true,
        data: mockTickets
      };
    } catch (error) {
      return {
        success: false,
        error: 'Não foi possível carregar seus chamados.'
      };
    }
  }
};
