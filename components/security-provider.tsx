'use client';

import React, { createContext, useContext } from 'react';

interface SecurityContextType {
  nonce: string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ 
  children, 
  nonce 
}: { 
  children: React.ReactNode;
  nonce: string;
}) {
  return (
    <SecurityContext.Provider value={{ nonce }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useNonce(): string {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useNonce must be used within a SecurityProvider');
  }
  return context.nonce;
}