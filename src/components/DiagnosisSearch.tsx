import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

interface Diagnosis {
  Consecutivo: number;
  Catalog_Key: string;
  Nombre: string;
}

interface DiagnosisSearchProps {
  selectedDiagnoses: Diagnosis[];
  onSelect: (diagnosis: Diagnosis) => void;
  onRemove: (diagnosis: Diagnosis) => void;
}

interface SortableDiagnosisTagProps {
  diagnosis: Diagnosis;
  onRemove: (diagnosis: Diagnosis) => void;
}

function SortableDiagnosisTag({ diagnosis, onRemove }: SortableDiagnosisTagProps) {
  const { currentTheme } = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: diagnosis.Consecutivo.toString(),
    data: {
      type: 'diagnosis',
      diagnosis: diagnosis,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
    background: `${currentTheme.colors.primary}20`,
    color: currentTheme.colors.primary,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'flex items-center gap-1 px-2 py-1 text-sm rounded-md touch-none',
        isDragging && 'shadow-lg'
      )}
    >
      <span className="font-medium">{diagnosis.Catalog_Key}</span>
      <span className="mx-1">-</span>
      <span>{diagnosis.Nombre}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(diagnosis);
        }}
        className="ml-1 p-0.5 rounded-full hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DiagnosisSearch({ selectedDiagnoses, onSelect, onRemove }: DiagnosisSearchProps) {
  const { currentTheme } = useTheme();
  const [availablePatologies, setAvailablePatologies] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    const loadActivePatologies = async () => {
      setIsLoading(true);
      try {
        // Cargar patologías activas directamente del catálogo
        const data = await api.patologies.getAllActive();
        
        // Convertir los datos de patologías al formato de Diagnosis
        const formattedPatologies: Diagnosis[] = data.map(patology => ({
          Consecutivo: parseInt(patology.id),
          Catalog_Key: patology.codcie10 || patology.nombre.substring(0, 6).toUpperCase(),
          Nombre: patology.nombre,
        }));
        
        setAvailablePatologies(formattedPatologies);
      } catch (error) {
        console.error('Error loading active patologies:', error);
        setAvailablePatologies([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivePatologies();
  }, []);

  const handleSelect = (diagnosis: Diagnosis) => {
    onSelect(diagnosis);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedDiagnoses.findIndex(
        (d) => d.Consecutivo.toString() === active.id
      );
      const newIndex = selectedDiagnoses.findIndex(
        (d) => d.Consecutivo.toString() === over.id
      );
      
      const reorderedDiagnoses = arrayMove(selectedDiagnoses, oldIndex, newIndex);
      onSelect(reorderedDiagnoses);
    }
  };

  // Filtrar patologías disponibles para no mostrar las ya seleccionadas
  const unselectedPatologies = availablePatologies.filter(patology =>
    !selectedDiagnoses.some(selected => selected.Consecutivo === patology.Consecutivo)
  );

  return (
    <div className="space-y-4">
      {/* Selected diagnoses tags */}
      <DndContext 
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={selectedDiagnoses.map(d => d.Consecutivo.toString())}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-2">
            {selectedDiagnoses.map((diagnosis) => (
              <SortableDiagnosisTag
                key={diagnosis.Consecutivo}
                diagnosis={diagnosis}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Available pathologies from catalog */}
      <div>
        <h4 
          className="text-sm font-medium mb-2"
          style={{ color: currentTheme.colors.text }}
        >
          Patologías Disponibles del Catálogo:
        </h4>
        
        {isLoading ? (
          <div 
            className="p-4 text-center text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Cargando patologías del catálogo...
          </div>
        ) : unselectedPatologies.length === 0 ? (
          <div 
            className="p-4 text-center text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            No hay patologías disponibles en el catálogo
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border rounded-md" style={{ borderColor: currentTheme.colors.border }}>
            {unselectedPatologies.map((patology) => (
              <button
                key={patology.Consecutivo}
                onClick={() => handleSelect(patology)}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded-md border transition-colors hover:bg-black/5"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                <span className="font-medium text-xs" style={{ color: currentTheme.colors.primary }}>
                  {patology.Catalog_Key}
                </span>
                <span className="text-xs">-</span>
                <span className="text-xs truncate max-w-[200px]">{patology.Nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}