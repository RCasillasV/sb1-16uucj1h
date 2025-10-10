import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

interface Diagnosis {
  Consecutivo: string;
  Catalog_Key: string;
  Nombre: string;
}

interface DiagnosisSearchProps {
  selectedDiagnoses: Diagnosis[];
  onSelect: (diagnosis: Diagnosis | Diagnosis[]) => void;
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
    id: diagnosis.Consecutivo?.toString() || diagnosis.Catalog_Key || '',
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
  // Validar y filtrar diagnósticos válidos
  const validDiagnoses = selectedDiagnoses.filter(d => d && (d.Consecutivo || d.Catalog_Key));
  
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = validDiagnoses.findIndex(
      (d) => (d.Consecutivo?.toString() || d.Catalog_Key || '') === active.id
    );
    const newIndex = validDiagnoses.findIndex(
      (d) => (d.Consecutivo?.toString() || d.Catalog_Key || '') === over.id
    );
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedDiagnoses = arrayMove(validDiagnoses, oldIndex, newIndex);
      onSelect(reorderedDiagnoses);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected diagnoses tags */}
      <DndContext 
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={validDiagnoses.map(d => d.Consecutivo?.toString() || d.Catalog_Key || '')}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-2">
            {validDiagnoses.map((diagnosis) => (
              <SortableDiagnosisTag
                key={diagnosis.Consecutivo?.toString() || diagnosis.Catalog_Key || Math.random().toString()}
                diagnosis={diagnosis}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}