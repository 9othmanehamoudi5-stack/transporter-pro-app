import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CRISP_ID = process.env.REACT_APP_CRISP_WEBSITE_ID;

const CrispChat = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!CRISP_ID) return;
    if (window.$crisp) return; // already loaded

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_ID;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    // Dark styling
    script.onload = () => {
      if (window.$crisp) {
        window.$crisp.push(['config', 'color:theme', 'blue_dark']);
        window.$crisp.push(['config', 'position:reverse', false]);
        window.$crisp.push([
          'do',
          'message:show',
          ['text', "Bonjour ! Besoin d'aide avec Transporter-Pro ? Posez votre question ici, nous répondons en moins de 5 minutes."]
        ]);
      }
    };
  }, []);

  // Identify user when logged in
  useEffect(() => {
    if (!user || !window.$crisp) return;
    try {
      window.$crisp.push(['set', 'user:email', [user.email]]);
      window.$crisp.push(['set', 'user:nickname', [user.name || user.email]]);
      if (user.company_id) {
        window.$crisp.push(['set', 'session:data', [[['company_id', user.company_id], ['role', user.role], ['plan', user.plan || 'solo']]]]);
      }
    } catch {}
  }, [user]);

  return null;
};

export default CrispChat;
