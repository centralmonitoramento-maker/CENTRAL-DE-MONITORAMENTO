
import { ClaimWizardData, TicketFormData, GravityLevel, ClaimantType, OccurrenceCategory } from '../types';
import { ZENDESK_CONFIG } from '../constants';

function isClaimWizardData(data: any): data is ClaimWizardData {
  return 'involved_parties' in data;
}

export const mapTicketToZendesk = (data: ClaimWizardData | TicketFormData) => {
  const isWizard = isClaimWizardData(data);
  const tags = [ZENDESK_CONFIG.TAGS.MOBILE_APP, `cat_${data.category}`];
  let priority: 'normal' | 'high' | 'urgent' = 'normal';

  const gravity = isWizard ? data.gravity : GravityLevel.MEDIUM;
  const location = isWizard ? data.location : (data as TicketFormData).property_address || 'Não informado';
  const branch = isWizard ? data.branch : 'N/A';
  const time = isWizard ? data.occurrence_time : 'N/A';

  if (gravity === GravityLevel.HIGH) {
    tags.push(ZENDESK_CONFIG.TAGS.HIGH_GRAVITY);
    priority = 'high';
  }

  if (!isWizard && (data as TicketFormData).is_emergency) {
    priority = 'urgent';
    tags.push(ZENDESK_CONFIG.TAGS.URGENT);
  }

  const custom_fields = [
    { id: ZENDESK_CONFIG.FIELDS.OCCURRENCE_DATE, value: data.occurrence_date },
    { id: ZENDESK_CONFIG.FIELDS.GRAVITY, value: gravity },
  ];

  let involvedSection = '';
  let requesterSection = '';
  let vehicleSection = '';
  let dynamicDetails = '';

  if (isWizard) {
    requesterSection = `
SOLICITANTE:
- Nome: ${data.requester_name.toUpperCase()}
- Função: ${data.requester_role.toUpperCase()}
`;

    if (data.category === OccurrenceCategory.COLLISION && data.vehicle_plate) {
      vehicleSection = `
DADOS DO VEÍCULO (COLISÃO):
- Placa: ${data.vehicle_plate.toUpperCase()}
- Marca/Modelo: ${data.vehicle_brand?.toUpperCase()}
- Cor: ${data.vehicle_color?.toUpperCase()}
`;
    }

    if (data.category === OccurrenceCategory.RECEIPT && data.invoice_number) {
      dynamicDetails = `\n📄 NOTA FISCAL: ${data.invoice_number.toUpperCase()}`;
    }

    if (data.category === OccurrenceCategory.CASH_SHORTAGE && data.cash_value) {
      dynamicDetails = `\n💸 VALOR FALTANTE: R$ ${data.cash_value}`;
    }

    involvedSection = data.involved_parties.length > 0 
      ? data.involved_parties.map((p, i) => `
ENVOLVIDO #${i + 1}:
- Qualificação: ${p.type.toUpperCase()}
- Nome: ${p.name}
- CPF/CNPJ: ${p.cpf}
- Contato: ${p.phone}
`).join('\n')
      : 'Nenhum outro envolvido registrado.';
  } else {
    requesterSection = `
SOLICITANTE:
- Nome: ${data.requester_name.toUpperCase()}
`;
    involvedSection = `
ENVOLVIDO ÚNICO:
- Qualificação: CLIENTE
- Nome: ${data.requester_name}
- CPF/CNPJ: N/A
- Contato: N/A
`;
  }

  const description = `
🚨 NOVA OCORRÊNCIA REGISTRADA 🚨
-----------------------------
LOGÍSTICA:
- Filial: ${branch.toUpperCase()}
- Data: ${data.occurrence_date}
- Horário: ${time}

DADOS DO EVENTO:
- Categoria: ${data.category.replace('_', ' ').toUpperCase()}
- Gravidade: ${gravity.toUpperCase()}
- Local Específico: ${location}
${vehicleSection}${dynamicDetails}

${requesterSection}

${involvedSection}

RELATO DOS FATOS:
${data.description}
  `.trim();

  return {
    ticket: {
      subject: isWizard 
        ? `[${branch.toUpperCase()}] ${data.category.toUpperCase()} - ${data.location}` 
        : ((data as TicketFormData).subject || `[SINISTRO] ${data.category.toUpperCase()}`),
      comment: { 
        body: description,
        uploads: isWizard ? data.uploadTokens : []
      },
      priority,
      tags,
      requester: {
        name: isWizard ? data.requester_name : data.requester_name,
        email: data.requester_email,
      },
      custom_fields
    }
  };
};

export const formatWhatsAppSummary = (data: ClaimWizardData, ticketId?: number): string => {
  const catEmoji: Record<string, string> = {
    colisao: '🚗',
    furto: '🛡️',
    degustacao: '🍽️',
    mau_procedimento: '⚠️',
    mau_subito: '🚑',
    acidente: '🆘',
    conflito: '🗣️',
    recebimento: '📦',
    quebra_de_caixa: '💸',
    fiscalizacao: '⚖️'
  };

  const vehicleInfo = (data.category === OccurrenceCategory.COLLISION && data.vehicle_plate) 
    ? `\n🚘 *Veículo:* ${data.vehicle_plate} (${data.vehicle_brand})`
    : '';
  
  const receiptInfo = (data.category === OccurrenceCategory.RECEIPT && data.invoice_number)
    ? `\n📄 *NF:* ${data.invoice_number}`
    : '';

  const involvedList = data.involved_parties.length > 0
    ? '\n👥 *Envolvidos:*\n' + data.involved_parties.map(p => `• ${p.name} (${p.type.toUpperCase()})`).join('\n')
    : '\n👥 *Envolvidos:* Nenhum';

  return `
${catEmoji[data.category] || '🚨'} *Ocorrência${ticketId ? ' CODD-' + ticketId : ''}*
🏢 *Unidade:* ${data.branch.toUpperCase()}
👤 *Solicitante:* ${data.requester_name.toUpperCase()} (${data.requester_role.toUpperCase()})${vehicleInfo}${receiptInfo}${involvedList}
📅 *Data/Hora:* ${data.occurrence_date} às ${data.occurrence_time}
📝 *Tipo:* ${data.category.replace('_', ' ').toUpperCase()}
📉 *Gravidade:* ${data.gravity.toUpperCase()}
📖 *Resumo:* ${data.description.substring(0, 80)}${data.description.length > 80 ? '...' : ''}
  `.trim();
};
