import React, { createContext, useContext, useRef, useCallback } from 'react';

const BotContext = createContext(null);

export function BotProvider({ children }) {
  const sandboxStateRef = useRef({});

  // Updates the state stored in ref without triggering re-renders
  const setSandboxState = useCallback((stateKey, stateData) => {
    sandboxStateRef.current[stateKey] = stateData;
  }, []);

  const getSandboxState = useCallback((stateKey) => {
    return sandboxStateRef.current[stateKey] || {};
  }, []);

  return (
    <BotContext.Provider value={{ setSandboxState, getSandboxState }}>
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
