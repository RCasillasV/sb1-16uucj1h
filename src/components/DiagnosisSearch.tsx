import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  } = useSortable({ id: diagnosis.Consecutivo.toString() });

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
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => resultsRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchDiagnoses = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchTerms = searchTerm.toLowerCase().split(' ');

        const { data, error } = await supabase
          .from('tcCIE10')
          .select('Consecutivo, Catalog_Key, Nombre')
          .or(searchTerms.map(term => `Catalog_Key.ilike.%${term}%,Nombre.ilike.%${term}%`).join(','))
          .limit(10);

        if (error) throw error;
        
        // Filter out already selected diagnoses
        const filteredData = data.filter(diagnosis => 
          !selectedDiagnoses.some(selected => selected.Consecutivo === diagnosis.Consecutivo)
        );
        
        setResults(filteredData);
      } catch (error) {
        console.error('Error searching diagnoses:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchDiagnoses, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, selectedDiagnoses]);

  const handleSelect = (diagnosis: Diagnosis) => {
    onSelect(diagnosis);
    setSearchTerm('');
    setShowResults(false);
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

  return (
    <div className="space-y-2" ref={searchRef}>
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

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Buscar diagnóstico por código o nombre..."
            className="w-full pl-10 pr-4 py-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>

        {/* Results dropdown */}
        {showResults && (searchTerm.trim() || isLoading) && (
          <div 
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 rounded-md shadow-lg border overflow-auto"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              maxHeight: '400px',
            }}
          >
            {isLoading ? (
              <div 
                className="p-4 text-center text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Buscando diagnósticos...
              </div>
            ) : results.length === 0 ? (
              <div 
                className="p-4 text-center text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                No se encontraron diagnósticos
              </div>
            ) : (
              <div
                style={{
                  height: `${Math.min(results.length * 40, 400)}px`,
                }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const diagnosis = results[virtualRow.index];
                    return (
                      <div
                        key={diagnosis.Consecutivo}
                        className={clsx(
                          'absolute top-0 left-0 w-full',
                          'px-4 py-2 cursor-pointer hover:bg-black/5 transition-colors'
                        )}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => handleSelect(diagnosis)}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-medium"
                            style={{ color: currentTheme.colors.primary }}
                          >
                            {diagnosis.Catalog_Key}
                          </span>
                          <span 
                            className="truncate"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {diagnosis.Nombre}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}