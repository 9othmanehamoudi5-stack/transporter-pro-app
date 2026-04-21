import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const TransporterBot = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour ! Je suis Transporter-Bot, votre assistant IA. Posez-moi vos questions sur les tarifs, la loi 2026, l'éco-score ou le fonctionnement de la plateforme." }
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
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [...messages, userMsg].slice(-10) })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion. Réessayez ou contactez support@transporter-pro.com." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-[#0066FF] hover:bg-[#0052CC] rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
          data-testid="chatbot-toggle"
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
                <p className="text-sm font-semibold text-white">Transporter-Bot</p>
                <p className="text-[10px] text-green-400">En ligne</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-colors" data-testid="chatbot-close">
              <X className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-[#0066FF]" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0066FF] text-white rounded-br-md'
                    : 'bg-white/[0.05] text-zinc-300 border border-white/[0.06] rounded-bl-md'
                }`} data-testid={`chat-msg-${msg.role}-${i}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-zinc-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-[#0066FF]" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06] bg-[#0A0A0B]">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Posez votre question..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none py-1.5"
                data-testid="chatbot-input"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] flex items-center justify-center disabled:opacity-30 transition-colors"
                data-testid="chatbot-send"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            {user && <p className="text-[10px] text-zinc-600 mt-1.5 text-center">Connecté en tant que {user.name}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default TransporterBot;
