import React, { createContext, useContext, useState } from 'react';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface SelectedPatientContextType {
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
}

const SelectedPatientContext = createContext<SelectedPatientContextType | undefined>(undefined);

export function SelectedPatientProvider({ children }: { children: React.ReactNode }) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  return (
    <SelectedPatientContext.Provider value={{ selectedPatient, setSelectedPatient }}>
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