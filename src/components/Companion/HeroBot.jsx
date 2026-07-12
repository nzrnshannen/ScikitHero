import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { streamGeminiChat } from '../../lib/gemini.js';
import { useBotState } from '../../lib/BotContext.jsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TOPIC_CHIPS = {
  knn: [
    "What is Minkowski distance?",
    "Why do I need to scale data here?",
    "Summarize this page for me"
  ],
  linear_regression: [
    "What's the difference between slope and intercept?",
    "How does Ordinary Least Squares work?",
    "Why does it assume a linear relationship?"
  ],
  ridge_lasso: [
    "What is regularization?",
    "Difference between L1 and L2 penalty?",
    "When should I use Ridge instead of Lasso?"
  ],
  // Fallback for others
  default: [
    "Can you explain this simply?",
    "What are the main use cases?",
    "Give me a real-world analogy"
  ]
};

const SYSTEM_PROMPT = `You are HeroBot, the friendly AI tutor built into SciKitHero by Shannen Nazareno. Your job is to read the user's current scikit-learn lesson page and explain complex, foreign data science concepts in an incredibly simple, jargon-free way for complete beginners. 
Break your answers down into three quick parts: 
1) What is this in plain English? 
2) When do we actually use it? 
3) A fun, real-world analogy (like explaining K-Means using separating different types of clothes in laundry). 
Keep responses punchy, scannable, and encouraging. Use markdown for bolding and lists, but do not use complex mathematical notation unless explicitly asked.

CURRENT CONTEXT:
`;

export default function HeroBot({ activeTopic }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I'm HeroBot 🤖. How can I help you understand this topic better?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { getSandboxState } = useBotState();

  const chips = TOPIC_CHIPS[activeTopic] || TOPIC_CHIPS.default;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const currentSandboxState = getSandboxState(activeTopic);
    
    // Inject context into the system prompt dynamically
    const dynamicSystemPrompt = `${SYSTEM_PROMPT}
Active Module: ${activeTopic}
Current Sandbox State: ${JSON.stringify(currentSandboxState, null, 2)}`;

    const newMessages = [...messages, userMsg];
    
    // Add placeholder for streaming response
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    streamGeminiChat(
      newMessages,
      dynamicSystemPrompt,
      (chunk) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          const rest = prev.slice(0, -1);
          return [...rest, { ...last, content: last.content + chunk }];
        });
      },
      () => {
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        setMessages(prev => {
          const rest = prev.slice(0, -1);
          return [...rest, { role: 'model', content: `Oops! Something went wrong: ${error.message}` }];
        });
      }
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 sm:w-96 h-[500px] max-h-[80vh] flex flex-col bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <div className="bg-brand-500/20 p-1.5 rounded-lg border border-brand-500/30">
                  <Bot className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">HeroBot</h3>
                  <p className="text-[10px] text-text-muted">Screen-Aware AI Tutor</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    msg.role === 'user' 
                      ? "ml-auto bg-brand-500 text-white rounded-br-none" 
                      : "mr-auto bg-white/10 text-slate-200 rounded-bl-none"
                  )}
                >
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed" 
                       dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              ))}
              
              {isLoading && (
                <div className="mr-auto bg-white/5 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-xs flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  HeroBot is reading the page...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {chips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 hover:bg-brand-500/20 transition-colors text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
                className="flex items-center gap-2 relative"
              >
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputValue.trim() && !isLoading) {
                        handleSend(inputValue);
                      }
                    }
                  }}
                  placeholder="Ask a question..."
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500/50 transition-colors resize-none overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1.5 p-1.5 bg-brand-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 hover:bg-brand-400 transition-all z-50 border border-brand-400/50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </div>
  );
}
