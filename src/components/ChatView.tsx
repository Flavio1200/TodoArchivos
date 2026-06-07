/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, ShieldCheck, CornerDownRight, User2 } from 'lucide-react';
import { ChatMessage, SharedFile, UserProfile } from '../types';
import { fetchChatMessages, sendChatMessage } from '../db';

interface ChatViewProps {
  file: SharedFile;
  currentUser: UserProfile;
  onClose: () => void;
  supabaseConnected: boolean;
}

const SIMULATED_REPLIES: Record<string, string[]> = {
  document: [
    "¡Se ve súper completo este informe! Gracias por compartir.",
    "¿Oye, de dónde sacaste las fuentes para las gráficas?",
    "Me sirve un montón para mi presentación de mañana."
  ],
  photo: [
    "¡Qué foto hermosa! Me gusta la paleta de colores.",
    "¿Es un filtro o está editada así de fábrica?",
    "Buenísima captura de pantalla del móvil."
  ],
  video: [
    "¡Qué calidad de video se manda la app!",
    "La carga del archivo va rapidísima.",
    "¡Wow! Increíble lugar, tengo que ir."
  ],
  audio: [
    "¡Se escucha genial el sonido analógico!",
    "Muy buen audio explicativo, me quedó todo clarísimo.",
    "¿Qué grabadora usaste para capturar la voz?"
  ],
  location: [
    "¡Conozco ese punto! Sirven unas hamburguesas increíbles cerca.",
    "Guardado en mi mapa para la próxima salida del fin de semana.",
    "¡Qué buena ruta de senderismo, la recomiendo!"
  ]
};

export default function ChatView({ file, currentUser, onClose, supabaseConnected }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    const msgs = await fetchChatMessages(file.id);
    setMessages(msgs);
    if (isInitial) setLoading(false);
  };

  useEffect(() => {
    loadMessages(true);
    
    // Configura actualización rápida en segundo plano para una sensación de chat en vivo real!
    const interval = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [file.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    const res = await sendChatMessage(
      file.id,
      currentUser.id,
      currentUser.alias,
      currentUser.avatar_url,
      msgText
    );

    setSending(false);

    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data!]);
      
      // If mock mode, trigger a cool AI bot response from other registered users
      if (!supabaseConnected) {
        setTimeout(async () => {
          const categoryReplies = SIMULATED_REPLIES[file.category] || [
            "¡Me interesa mucho lo que subiste!",
            "¡Gracias por el aporte al grupo!",
            "Buen material para investigar."
          ];
          const randomReply = categoryReplies[Math.floor(Math.random() * categoryReplies.length)];
          const responderName = Math.random() > 0.5 ? 'AndresM' : 'Sofi_J';
          const responderId = responderName === 'AndresM' ? 'u-1' : 'u-2';
          const responderAvatar = responderName === 'AndresM' 
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

          await sendChatMessage(
            file.id,
            responderId,
            responderName,
            responderAvatar,
            randomReply
          );

          // Refresh messages
          const updated = await fetchChatMessages(file.id);
          setMessages(updated);
        }, 1500);
      }
    } else {
      setErrorMsg(res.error || 'Error al enviar mensaje');
      // Limpiar automáticamente después de 6 segundos
      setTimeout(() => setErrorMsg(null), 6000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-t-[32px] rounded-b-[24px] w-full max-w-[370px] h-[78%] flex flex-col shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-300 border-2 border-[#10b981]/15">
        
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-[#10b981] to-[#06b6d4] px-5 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-xs select-none uppercase tracking-wide opacity-80 leading-snug">Discusión</h3>
              <p className="font-extrabold text-sm truncate max-w-[190px] leading-tight mt-0.5">{file.name}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-9.5 h-9.5 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all focus:outline-none"
            id="chat-close-btn"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* File owner summary ribbon */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-left flex items-center gap-1.5 shrink-0">
          <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] text-slate-500 font-medium">
            Subido por <b className="text-slate-700">@{file.authorAlias}</b> el {new Date(file.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></span>
              <span className="text-xs font-semibold">Cargando comentarios...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2 select-none">
              <MessageSquare className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-bold text-slate-500">¿Qué te parece este archivo?</p>
              <p className="text-[10px] text-slate-400 font-medium max-w-[200px]">¡Nadie ha escrito comentarios aún! Sé el primero en discutir este elemento.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.userId === currentUser.id;
              return (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2.5 animate-in fade-in duration-200 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {msg.authorAvatar ? (
                    <img
                      src={msg.authorAvatar}
                      alt={msg.authorAlias}
                      className="w-8 h-8 rounded-full border border-slate-150 object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                      <User2 className="w-4 h-4" />
                    </div>
                  )}

                  {/* Bubble wrapper */}
                  <div className={`flex flex-col max-w-[70%] text-left ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">
                      @{msg.authorAlias}
                    </span>
                    <div className={`rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed ${
                      isMe 
                        ? 'bg-[#10b981] text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap font-medium break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Inline sandboxed toast notifications */}
        {errorMsg && (
          <div className="bg-rose-50 border-t border-b border-rose-100 px-4 py-2 flex items-start justify-between gap-2.5 text-left animate-in slide-in-from-bottom duration-200">
            <span className="text-[10px] text-rose-600 font-extrabold leading-normal flex-1">
              ⚠️ {errorMsg}
            </span>
            <button 
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-600 font-black text-xs cursor-pointer p-0.5 leading-none shrink-0"
              title="Cerrar advertencia"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Form Box */}
        <form 
          onSubmit={handleSendMessage} 
          className="bg-white px-4 py-3 border-t border-slate-150 shrink-0 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Mensaje o sugerencia..."
            value={newMessage}
            disabled={sending}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-8.5 h-8.5 rounded-xl bg-[#10b981] disabled:bg-slate-200 hover:bg-[#059669] text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none cursor-pointer"
            id="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
