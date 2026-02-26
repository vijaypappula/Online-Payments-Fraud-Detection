import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertCircle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const KnowledgeBase: React.FC = () => {
  const [tip, setTip] = useState("Monitoring system initializing...");

  const fetchTip = async () => {
    try {
      const genAI = new GoogleGenerativeAI('AIzaSyA6dDNMi7vBNkoUSqnU-TOOezrY4HMEKcQ');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-001",
      });

      const systemInstruction = "You are a senior security researcher. Be concise and technical.";
      const prompt = "Give a one-sentence pro tip for a financial auditor to spot modern payment fraud.";

      const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`);
      const response = result.response;

      setTip(response.text() || "Watch for rapid balance zeroing across multiple accounts.");
    } catch (e) {
      console.error("KnowledgeBase API Error:", e);
      setTip("Could not fetch a live tip. Please check API key and network. Using a fallback tip.");
    }
  };

  useEffect(() => {
    fetchTip();
    const interval = setInterval(fetchTip, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-6 px-4">
      <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:rotate-12 transition-transform">
          <Lightbulb className="w-12 h-12" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-3">
             <AlertCircle className="w-3 h-3 text-indigo-200" />
             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Pro Auditor Tip</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p 
              key={tip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs font-medium leading-relaxed"
            >
              "{tip}"
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};