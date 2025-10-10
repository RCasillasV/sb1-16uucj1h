import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Database } from '../types/database.types';
import { calculateAge } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface VirtualizedPatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  selectedPatientId?: string | null;
  height: number;
  itemHeight?: number;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
}

export const VirtualizedPatientList = memo(function VirtualizedPatientList({
  patients,
  onSelectPatient,
  selectedPatientId,
  height,
  itemHeight = 60,
}: VirtualizedPatientListProps) {
  const { currentTheme } = useTheme();

  const Row = ({ index, style }: RowProps) => {
    const patient = patients[index];
    const isSelected = selectedPatientId === patient.id;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          padding: '12px 24px',
          cursor: 'pointer',
          backgroundColor: isSelected 
            ? `${currentTheme.colors.primary}20` 
            : 'transparent',
          borderBottom: `1px solid ${currentTheme.colors.border}`,
          transition: 'background-color 0.2s',
        }}
        onClick={() => onSelectPatient(patient)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = `${currentTheme.colors.primary}10`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div 
            className="font-medium truncate"
            style={{ color: currentTheme.colors.text }}
          >
            {`${patient.Nombre} ${patient.Paterno} ${patient.Materno || ''}`}
          </div>
          <div 
            className="text-sm truncate"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {patient.Email || 'Sin email'}
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4 ml-4">
          <div 
            className="text-sm whitespace-nowrap"
            style={{ color: currentTheme.colors.text }}
          >
            {calculateAge(patient.FechaNacimiento).formatted}
          </div>
          <div 
            className="text-sm whitespace-nowrap hidden md:block"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {patient.Telefono || '-'}
          </div>
          <div 
            className="text-sm whitespace-nowrap"
            style={{ color: currentTheme.colors.text }}
          >
            {patient.Sexo}
          </div>
        </div>
      </div>
    );
  };

  if (patients.length === 0) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ 
          height,
          color: currentTheme.colors.textSecondary 
        }}
      >
        No hay pacientes para mostrar
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={patients.length}
      itemSize={itemHeight}
      width="100%"
      style={{
        background: currentTheme.colors.surface,
      }}
    >
      {Row}
    </List>
  );
});
