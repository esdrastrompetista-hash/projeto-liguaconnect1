import { useState, useRef, useEffect } from 'react';
import type { UserProfile, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, X, Send, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatProps {
  user: UserProfile;
  currentUserId: string;
  onClose: () => void;
  onStartCall: (user: UserProfile) => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
}

export function Chat({ 
  user, 
  currentUserId, 
  onClose, 
  onStartCall, 
  messages, 
  onSendMessage,
  isTyping
}: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-semibold">
              {getInitials(user.name)}
            </div>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <h4 className="text-white font-semibold">{user.name}</h4>
            <p className="text-white/70 text-xs">
              {user.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onStartCall(user)}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <p className="text-sm">Inicie uma conversa com {user.name}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showTime = index === messages.length - 1 || 
                new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime() > 60000;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-violet-600 text-white rounded-br-md'
                          : 'bg-white text-slate-800 shadow-sm rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {showTime && (
                      <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex justify-start"
                >
                  <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-violet-600"
          >
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 border-slate-200 focus-visible:ring-violet-500"
          />
          <Button
            size="icon"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
