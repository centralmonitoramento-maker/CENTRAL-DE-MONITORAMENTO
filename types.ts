
export enum ClaimantType {
  CLIENT = 'cliente',
  EMPLOYEE = 'colaborador',
  THIRD_PARTY = 'terceiro'
}

export enum OccurrenceCategory {
  NONE = '',
  COLLISION = 'colisao',
  THEFT = 'furto',
  TASTING = 'degustacao',
  MISCONDUCT = 'mau_procedimento',
  SUDDEN_ILLNESS = 'mau_subito',
  ACCIDENT = 'acidente',
  CONFLICT = 'conflito',
  RECEIPT = 'recebimento',
  CASH_SHORTAGE = 'quebra_de_caixa',
  INSPECTION = 'fiscalizacao'
}

export enum GravityLevel {
  LOW = 'baixa',
  MEDIUM = 'media',
  HIGH = 'alta'
}

export enum TicketCategory {
  AUTO = 'automovel',
  RESIDENTIAL = 'residencial',
  LIFE = 'vida',
  HEALTH = 'saude'
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface InvolvedParty {
  type: ClaimantType;
  name: string;
  cpf: string;
  phone: string;
}

export interface TicketFormData {
  requester_name: string;
  requester_email: string;
  policy_number: string;
  occurrence_date: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  is_emergency: boolean;
  license_plate?: string;
  property_address?: string;
}

export interface ClaimWizardData {
  // Passo 1: Local e Hora
  branch: string;
  occurrence_date: string;
  occurrence_time: string;

  // Passo 2: Dados do Solicitante e Envolvidos
  requester_name: string;
  requester_role: string;
  requester_email: string;
  involved_parties: InvolvedParty[];
  
  // Passo 3: Ocorrência
  category: OccurrenceCategory;
  gravity: GravityLevel;
  location: string;
  description: string;
  
  // Campos Condicionais para Colisão
  vehicle_plate?: string;
  vehicle_brand?: string;
  vehicle_color?: string;

  // Campos Condicionais Adicionais (Smart logic)
  invoice_number?: string;
  cash_value?: string;

  // Passo 4: Evidências
  files: File[];
  uploadTokens: string[];
}

export interface ZendeskTicket {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  priority: string;
  description: string;
}

export interface TicketNotification {
  id: string;
  ticketId: number;
  message: string;
  type: 'status_change' | 'new_comment' | 'urgent_alert';
  timestamp: string;
  read: boolean;
}

export interface ServerResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
