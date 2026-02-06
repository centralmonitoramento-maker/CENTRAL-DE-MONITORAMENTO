
import React, { useEffect } from 'react';
import { ZENDESK_CONFIG } from '../constants';

const ChatWidget: React.FC = () => {
  useEffect(() => {
    // Evita carregar múltiplas vezes
    if (document.getElementById('ze-snippet')) return;

    const script = document.createElement('script');
    script.id = 'ze-snippet';
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_CONFIG.WEB_WIDGET_KEY}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Opcional: remover script ao desmontar
    };
  }, []);

  return null; // O widget é injetado globalmente pelo script
};

export default ChatWidget;
