import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

const BotContext = createContext(null);

export function BotProvider({ children }) {
  const sandboxStateRef = useRef({});
  const [chatHistory, setChatHistory] = useState([]);

  // Updates the state stored in ref without triggering re-renders
  const setSandboxState = useCallback((stateKey, stateData) => {
    sandboxStateRef.current[stateKey] = stateData;
  }, []);

  const getSandboxState = useCallback((stateKey) => {
    return sandboxStateRef.current[stateKey] || {};
  }, []);

  const addChatMessage = useCallback((topic, role, content) => {
    setChatHistory(prev => [...prev, { id: Date.now() + Math.random(), topic, role, content }]);
  }, []);

  const updateLastChatMessage = useCallback((chunk) => {
    setChatHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      return [...rest, { ...last, content: last.content + chunk }];
    });
  }, []);
  
  const replaceLastChatMessage = useCallback((content) => {
    setChatHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      return [...rest, { ...last, content }];
    });
  }, []);

  return (
    <BotContext.Provider value={{ 
      setSandboxState, 
      getSandboxState,
      chatHistory,
      addChatMessage,
      updateLastChatMessage,
      replaceLastChatMessage
    }}>
      {children}
    </BotContext.Provider>
  );
}

export function useBotState() {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBotState must be used within a BotProvider');
  }
  return context;
}
