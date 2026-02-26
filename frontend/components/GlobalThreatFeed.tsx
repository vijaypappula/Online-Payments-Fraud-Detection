import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, TrendingUp, AlertTriangle } from 'lucide-react';

const THREATS = [
  "Abnormal TRANSFER volume detected in Southeast Asia region",
  "New 'Balance Zeroing' script identified in mobile banking apps",
  "High-velocity CASH_OUT attacks trending in retail sector",
  "Model updated: Improved detection for small-amount layering",
  "Phishing campaigns impersonating 'SecurePay' verified",
  "Unusual DEBIT activity spike in Eastern European gateways"
];

export const GlobalThreatFeed: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % THREATS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-full w-[450px] overflow-hidden">
      <div className="flex items-center mr-3 text-rose-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">
        <TrendingUp className="w-3 h-3 mr-1.5" />
        Live Feed
      </div>
      <div className="h-4 flex-grow overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.p 
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="text-[11px] font-bold text-slate-500 truncate italic"
          >
            {THREATS[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};