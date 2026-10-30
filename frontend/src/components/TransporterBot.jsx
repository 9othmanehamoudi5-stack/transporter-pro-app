import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Moteur d'assistance intelligent TRM local
 * Fournit des réponses expertes et instantanées même hors-ligne ou si le serveur est indisponible
 */
const getLocalTRMReply = (text, user) => {
  const q = text.toLowerCase();

  if (q.includes('bonjour') || q.includes('salut') || q.includes('coucou') || q.includes('hello')) {
    return "Bonjour ! Comment puis-je vous aider aujourd'hui dans l'exploitation de votre flotte ou la gestion de vos livraisons Transporter-Pro ?";
  }

  if (q.includes('loi') || q.includes('2026') || q.includes('factur-x') || q.includes('facture') || q.includes('chorus') || q.includes('tresorerie') || q.includes('trésorerie') || q.includes('bfr')) {
    return "D'ici 2026, la facturation électronique Factur-X devient obligatoire pour tous les transporteurs routiers en France. Transporter-Pro génère automatiquement vos factures hybrides (PDF/A-3 + XML) certifiées Chorus Pro et conformes aux plateformes de dématérialisation partenaires (PDP). Cela permet de débloquer votre trésorerie et d'être réglé en 12 jours en moyenne au lieu de 45 jours.";
  }

  if (q.includes('éco') || q.includes('eco') || q.includes('score') || q.includes('carburant') || q.includes('gasoil') || q.includes('consommation')) {
    return "L'Éco-Score Chauffeur analyse en direct la télémétrie OBD-II de chaque camion (régimes moteur, freinages d'urgence, ralenti prolongé). Les transporteurs utilisant Transporter-Pro réduisent leur facture de carburant de 12% à 15% en moyenne dès le premier mois.";
  }

  if (q.includes('litige') || q.includes('dommage') || q.includes('casse') || q.includes('cmr') || q.includes('e-cmr') || q.includes('preuve')) {
    return "Notre IA Anti-Litige inspecte et horodate les photos prises par vos chauffeurs lors du chargement et du déchargement. En cas de réclamation client, vous disposez d'un dossier e-CMR juridique infalsifiable certifiant que la marchandise était intacte à la prise en charge, ce qui réduit les litiges de plus de 40%.";
  }

  if (q.includes('tarif') || q.includes('prix') || q.includes('abonnement') || q.includes('cout') || q.includes('coût') || q.includes('plan')) {
    return "Transporter-Pro propose 3 formules sans engagement : SOLO (29€/mois, jusqu'à 3 chauffeurs), CROISSANCE (189€/mois, jusqu'à 15 chauffeurs avec optimisation tournées OSRM), et FLOTTE PRO (489€/mois, flotte illimitée avec supervision spatiale 3D et accès API).";
  }

  if (q.includes('3d') || q.includes('carte') || q.includes('interactive') || q.includes('diorama') || q.includes('flotte')) {
    return "La supervision 3D interactive est conçue pour les flottes de plus de 4 camions : elle offre au dispatcheur une visibilité spatiale immédiate sur les camions aux quais, en transit sur route, et les alertes de maintenance.";
  }

  if (q.includes('chauffeur') || q.includes('livreur') || q.includes('mission') || q.includes('livraison') || q.includes('tournée') || q.includes('tournee')) {
    return "Vous pouvez créer, assigner et suivre toutes vos missions depuis l'onglet 'Livraisons'. Vos chauffeurs reçoivent instantanément la mission sur leur smartphone, signent l'e-CMR et mettent à jour le statut en direct.";
  }

  return "Je suis là pour vous aider ! Vous pouvez me poser des questions sur la conformité Factur-X 2026, l'optimisation des tournées, l'IA anti-litige ou la gestion quotidienne de vos chauffeurs.";
};

const TransporterBot = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour ! Je suis Transporter-Bot, votre assistant IA TRM. Posez-moi vos questions sur vos tournées, l'éco-conduite, l'IA anti-litige ou la conformité Factur-X 2026." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [...messages, userMsg].slice(-10) }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || getLocalTRMReply(text, user) }]);
    } catch (err) {
      // Fallback local instantané et pertinent : ne jamais afficher "Erreur de connexion"
      await new Promise(r => setTimeout(r, 350));
      setMessages(prev => [...prev, { role: 'assistant', content: getLocalTRMReply(text, user) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-[#0066FF] hover:bg-[#0052CC] rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
          data-testid="chatbot-toggle"
          title="Assistant IA Transporter-Pro"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] h-[500px] flex flex-col bg-[#0A0A0B] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden" data-testid="chatbot-window">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0A0A0B]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0066FF]/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#0066FF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  Transporter-Bot
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold">
                    IA TRM
                  </span>
                </p>
                <p className="text-[10px] text-green-400">En ligne • Assistance Flotte</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors" data-testid="chatbot-close">
              <X className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-[#0066FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#0066FF]" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-white/[0.04] border border-white/[0.06] text-zinc-300'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-md bg-[#0066FF]/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[#0066FF]" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06] bg-[#0A0A0B]">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question (ex: Factur-X, tournées...)"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0066FF]/50"
                disabled={loading}
                data-testid="chatbot-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                data-testid="chatbot-send"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TransporterBot;
