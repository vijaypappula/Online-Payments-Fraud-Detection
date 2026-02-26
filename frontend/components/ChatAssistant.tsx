import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { X, Send, Sparkles } from 'lucide-react';
import { TransactionData, PredictionResult, ChatMessage as ImportedChatMessage } from '../types';

// Extend the imported type with an ID for local state management and stable keys.
type ChatMessage = ImportedChatMessage & { id: string };
 
interface Props {
  isOpen: boolean;
  onClose: () => void;
  lastTransaction: TransactionData | null;
  lastResult: PredictionResult | null;
}

export const ChatAssistant = ({ isOpen, onClose, lastTransaction, lastResult }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: 'model', text: 'Hello! I am your AI Fraud Analyst. How can I help you investigate these transactions today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The API key is now securely read from environment variables.
  // For local development, create a .env.local file in the root of your project
  // and add the line: VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const genAI = useMemo(() =>
    geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null,
    [geminiApiKey]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev: ChatMessage[]) => [...prev, { id: crypto.randomUUID(), role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      if (!genAI) {
        setMessages((prev: ChatMessage[]) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'model',
            text: 'Gemini is not configured. Set VITE_GEMINI_API_KEY in your deployment environment.',
          },
        ]);
        return;
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
      });

      const systemInstruction = "You are a friendly but professional Cyber Security and Anti-Fraud expert. Give practical, technical advice based on the context. Keep answers concise.";

      const context = lastTransaction ? 
        `Context: The user just analyzed a ${lastTransaction.type} for $${lastTransaction.amount}. 
        System prediction was ${lastResult?.prediction} with ${Math.round((lastResult?.probability || 0) * 100)}% risk.
        System Reasoning: ${lastResult?.reasoning}` : 
        "No transaction currently analyzed.";

      const prompt = `${systemInstruction}\n\n${context}\n\nUser Question: ${userMsg}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;

      setMessages((prev: ChatMessage[]) => [...prev, { id: crypto.randomUUID(), role: 'model', text: response.text() || "I'm sorry, I couldn't process that request." }]);
    } catch (err: any) {
      console.error("Chat Assistant API Error:", err);

      let errorMessage = "Sorry, I've encountered an error connecting to the intelligence module.";
      if (err.message) {
        errorMessage += ` Details: ${err.message}`;
      } else {
        errorMessage += " Please check the developer console for more details.";
      }

      setMessages((prev: ChatMessage[]) => [...prev, {
        id: crypto.randomUUID(),
        role: 'model', 
        text: errorMessage
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="fixed bottom-6 right-6 w-96 h-[550px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Security Companion</h3>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Intelligence</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center bg-slate-100 rounded-xl px-4 py-2">
              <input 
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about transaction risk..."
                className="flex-grow bg-transparent border-none outline-none text-sm py-2"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="p-2 text-indigo-600 disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
