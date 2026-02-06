
export const ZENDESK_CONFIG = {
  SUBDOMAIN: 'sua_instancia',
  WEB_WIDGET_KEY: 'SUA_KEY_AQUI', // Snippet Key do Zendesk Messaging
  TECH_GROUP_ID: 123456,
  // Mapeamento de IDs de campos personalizados reais do seu Zendesk Admin Center
  FIELDS: {
    CLAIMANT_TYPE: 36000001, // ID do campo "Tipo de Reclamante"
    POLICY_NUMBER: 36000002, // ID do campo "Número da Apólice"
    LICENSE_PLATE: 36000003, // ID do campo "Placa"
    OCCURRENCE_DATE: 36000004, // ID do campo "Data do Sinistro"
    GRAVITY: 36000005, // ID do campo "Gravidade"
  },
  TAGS: {
    URGENT: 'sinistro_urgente',
    HIGH_GRAVITY: 'gravidade_alta',
    MOBILE_APP: 'origem_pwa_mobile'
  }
};

export const UI_THEME = {
  PRIMARY_YELLOW: '#FFD700',
  SECONDARY_RED: '#E63946',
  DARK_BG: '#1A1A1A',
  TEXT_ON_YELLOW: '#1A1A1A',
};
