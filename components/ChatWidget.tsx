
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatWidgetProps {
  rideId: string;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (rideId: string, text: string) => void;
  otherPartyName: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  isOtherTyping?: boolean; // Nova prop para o indicador de digitação
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  rideId, messages, currentUserId, onSendMessage, otherPartyName,
  isOpen: externalOpen, onToggle, isOtherTyping = false
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isOtherTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(rideId, text.trim());
      setText('');
    }
  };

  const toggleChat = () => {
    if (onToggle) onToggle(!isOpen);
    else setInternalOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-24 right-6 z-[100] md:bottom-8 md:right-8">
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        .typing-dot {
          animation: typingBounce 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
      
      {isOpen ? (
        <div className="bg-white w-[320px] h-[450px] rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up">
          <div className="p-5 bg-indigo-950 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-comment-alt text-xs"></i>
                </div>
                {isOtherTyping && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-indigo-950 rounded-full animate-pulse"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs uppercase tracking-widest leading-none">{otherPartyName}</span>
                {isOtherTyping && <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-tighter mt-1">Digitando...</span>}
              </div>
            </div>
            <button onClick={toggleChat} className="opacity-60 hover:opacity-100 transition-opacity p-2">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && !isOtherTyping ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <i className="fas fa-comments text-4xl mb-2 opacity-20"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Sem mensagens ainda</p>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.senderId === currentUserId 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-[8px] mt-1 font-bold uppercase ${msg.senderId === currentUserId ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isOtherTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1">
                      <div className="typing-dot w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      <div className="typing-dot w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      <div className="typing-dot w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
            <input 
              type="text" 
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Escreva uma mensagem..." 
              className="flex-1 bg-slate-50 px-4 py-2.5 rounded-xl text-sm focus:outline-none border border-transparent focus:border-indigo-100 transition-all placeholder:text-slate-300 font-medium"
            />
            <button type="submit" disabled={!text.trim()} className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${text.trim() ? 'bg-indigo-950 text-white' : 'bg-slate-100 text-slate-300'}`}>
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={toggleChat}
          className="w-16 h-16 bg-indigo-950 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform relative group"
        >
          <i className="fas fa-comment-dots text-2xl"></i>
          {(messages.length > 0 || isOtherTyping) && (
            <span className={`absolute -top-1 -right-1 ${isOtherTyping ? 'bg-green-500 animate-pulse' : 'bg-red-500'} text-white w-6 h-6 rounded-full border-4 border-white text-[10px] font-black flex items-center justify-center shadow-sm`}>
              {isOtherTyping ? <i className="fas fa-ellipsis-h"></i> : messages.length}
            </span>
          )}
          <span className="absolute right-20 bg-indigo-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            {isOtherTyping ? `${otherPartyName} digitando...` : `Falar com ${otherPartyName}`}
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
