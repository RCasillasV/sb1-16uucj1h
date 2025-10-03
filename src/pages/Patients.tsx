import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Users, Edit, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../lib/api';
import type { Database } from '../types/database.types';
import { PatientListSelector } from '../components/PatientListSelector';
import { PatientForm } from '../components/PatientForm';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

export function Patients() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { currentTheme } = useTheme();

  const handlePatientCreated = (newPatient: Patient) => {
    setShowForm(false);
    setSelectedPatientForEdit(null);
    setSelectedPatient(newPatient);
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleEditPatient = () => {
    if (selectedPatient) {
      setSelectedPatientForEdit(selectedPatient);
      setShowForm(true);
    }
  };

  const buttonStyle = {
    base: clsx(
      'flex items-center px-4 py-2 transition-all duration-200',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
    secondary: {
      background: currentTheme.colors.buttonSecondary,
      color: currentTheme.colors.buttonText,
    },
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <PatientForm
          onSuccess={handlePatientCreated}
          onCancel={() => {
            setShowForm(false);
            setSelectedPatientForEdit(null);
          }}
          patient={selectedPatientForEdit}
        />
      </div>
    );
  }

  return (
    <div className="w-full md:w-11/12 mx-auto space-y-2">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" style={{ color: currentTheme.colors.text }} />
          <h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>
            Pacientes
          </h1>
        </div>
        <div className="flex gap-2">
          {selectedPatient && (
            <button
              onClick={handleEditPatient}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
            >
              <Edit className="h-5 w-5 mr-2" />
              Editar
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            <UserPlus className="h-5 w-5 mr-5" />
            Nuevo
          </button>
        </div>
      </div>
      <PatientListSelector
        onSelectPatient={handlePatientClick}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}