import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { DiagnosisSearch } from '../components/DiagnosisSearch';

interface Diagnosis {
  Consecutivo: number;
  Catalog_Key: string;
  Nombre: string;
}

export function CIE10() {
  const { currentTheme } = useTheme();
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<Diagnosis[]>([]);

  const handleSelect = (diagnosisOrArray: Diagnosis | Diagnosis[]) => {
    if (Array.isArray(diagnosisOrArray)) {
      setSelectedDiagnoses(diagnosisOrArray);
      return;
    }

    // Check if diagnosis already exists
    if (!selectedDiagnoses.some(d => d.Consecutivo === diagnosisOrArray.Consecutivo)) {
      setSelectedDiagnoses(prev => [...prev, diagnosisOrArray]);
    }
  };

  const handleRemove = (diagnosis: Diagnosis) => {
    setSelectedDiagnoses(prev => 
      prev.filter(d => d.Consecutivo !== diagnosis.Consecutivo)
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText 
          className="h-6 w-6" 
          style={{ color: currentTheme.colors.primary }} 
        />
        <h1 
          className="text-2xl font-bold"
          style={{ color: currentTheme.colors.text }}
        >
          Diagnósticos CIE-10
        </h1>
      </div>

      <div 
        className="rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <DiagnosisSearch
          selectedDiagnoses={selectedDiagnoses}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />

        {selectedDiagnoses.length > 0 && (
          <div 
            className="mt-6 p-4 rounded-md"
            style={{ 
              background: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h2 
              className="text-lg font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Diagnósticos Seleccionados ({selectedDiagnoses.length})
            </h2>
            <div className="space-y-2">
              {selectedDiagnoses.map((diagnosis) => (
                <div 
                  key={diagnosis.Consecutivo}
                  className="flex items-center gap-2"
                >
                  <span 
                    className="font-medium"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    {diagnosis.Catalog_Key}
                  </span>
                  <span style={{ color: currentTheme.colors.text }}>
                    {diagnosis.Nombre}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}