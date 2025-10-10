import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface SelectedPatientContextType {
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
}

const SelectedPatientContext = createContext<SelectedPatientContextType | undefined>(undefined);

export function SelectedPatientProvider({ children }: { children: React.ReactNode }) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    selectedPatient,
    setSelectedPatient
  }), [selectedPatient]);

  return (
    <SelectedPatientContext.Provider value={contextValue}>
      {children}
    </SelectedPatientContext.Provider>
  );
}

export const useSelectedPatient = () => {
  const context = useContext(SelectedPatientContext);
  if (context === undefined) {
    throw new Error('useSelectedPatient must be used within a SelectedPatientProvider');
  }
  return context;
};