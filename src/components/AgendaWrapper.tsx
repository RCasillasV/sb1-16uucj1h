import React from 'react';
import { AgendaProvider } from '../contexts/AgendaContext';

interface AgendaWrapperProps {
  children: React.ReactNode;
}

export const AgendaWrapper: React.FC<AgendaWrapperProps> = ({ children }) => {
  return (
    <AgendaProvider>
      {children}
    </AgendaProvider>
  );
};