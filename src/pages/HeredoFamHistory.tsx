// src/pages/HeredoFamHistory.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contact as Family, User, FileText, Plus, Save, AlertCircle, Trash2, X, GripVertical } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core'; 
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

// --- 1. Definición de Tipos y Esquemas ---

interface AppPatology {
  id: string;
  nombre: string;
}

interface HeredoFamilialPathology {
  nPatologia: string;
}

interface FamilyMember {
  id?: string;
  miembro_fam_key: string;
  estado_vital: string;
  edad?: number;
  patologias: HeredoFamilialPathology[];
  observaciones?: string;
}

// Familiares predefinidos basados en tu captura de pantalla
const FIXED_FAMILY_MEMBERS = [
  { key: 'Madre', label: 'Madre' },
  { key: 'Abuela (Materna)', label: 'Abuela (Materna)' },
  { key: 'Abuelo (Materno)', label: 'Abuelo (Materno)' },
  { key: 'Padre', label: 'Padre' },
  { key: 'Abuela (Paterna)', label: 'Abuela (Paterna)' },
  { key: 'Abuelo (Paterno)', label: 'Abuelo (Paterno)' },
  { key: 'Hermanos', label: 'Hermanos' },
];

// Esquema Zod para un familiar individual
const familyMemberSchema = z.object({
  id: z.string().optional(),
  miembro_fam_key: z.string(),
  estado_vital: z.string().nullable().optional(),
  edad: z.preprocess(
    (val) => {
      // Convertir string vacío, null, undefined, o NaN a null
      if (val === '' || val === null || val === undefined) {
        return null;
      }
      const num = Number(val);
      return Number.isNaN(num) ? null : num;
    },
    z.number().nullable().optional()
  ),
  patologias: z.array(z.object({
    nPatologia: z.string(),
  })).default([]),
  observaciones: z.string().nullable().optional(),
});

// Esquema principal del formulario
const heredoFamilialFormDataSchema = z.object({
  familyMembers: z.array(familyMemberSchema).default([]),
});

type HeredoFamilialFormData = z.infer<typeof heredoFamilialFormDataSchema>;

// --- 2. Componente para Patología Arrastrable ---
interface DraggablePathologyTagProps {
  patology: AppPatology;
  onRemove: (patology: AppPatology) => void;
  isFromCatalog?: boolean;
}

function DraggablePathologyTag({ patology, onRemove, isFromCatalog = false }: DraggablePathologyTagProps) {
  const { currentTheme } = useTheme();
  
  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: `patology-${patology.id}`,
    data: {
      type: 'patology',
      patology: patology,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.01 : 1.0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'flex items-center gap-1 px-3 py-1 text-sm rounded-md touch-none select-none',
        'cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-lg',
        isFromCatalog ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-800 border border-gray-300'
      )}
    >
      <GripVertical className="h-3 w-3 opacity-50" />
      <span className="truncate">{patology.nombre}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(patology);
        }}
        style={buttonStyle.primary}
        className={clsx(
          "ml-1 p-0.5 rounded-full transition-colors hover:bg-black/10 cursor-pointer"
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// --- 3. Componente para Área de Soltar Familiar ---
interface DroppableFamilyRowProps {
  familyMemberKey: string;
  children: React.ReactNode;
  isOver?: boolean;
}

function DroppableFamilyRow({ familyMemberKey, children, isOver }: DroppableFamilyRowProps) {
  const { currentTheme } = useTheme();
  const { setNodeRef } = useDroppable({
    id: `family-${familyMemberKey}`,
    data: {
      type: 'family-member',
      familyMemberKey,
    },
  });

  return (
    <tr
      ref={setNodeRef}
      className={clsx(
        'transition-colors',
        isOver && 'bg-blue-50 ring-2 ring-blue-300'
      )}
      style={{
        backgroundColor: isOver ? `${currentTheme.colors.primary}20` : 'transparent',
      }}
    >
      {children}
    </tr>
  );
}

// --- 4. Componente Principal ---
export function HeredoFamHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  const [globalSelectedCatalogPatologies, setGlobalSelectedCatalogPatologies] = useState<AppPatology[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<HeredoFamilialFormData>({
    resolver: zodResolver(heredoFamilialFormDataSchema),
    defaultValues: {
      familyMembers: FIXED_FAMILY_MEMBERS.map(member => ({
        id: undefined,
        miembro_fam_key: member.key,
        estado_vital: '',
        edad: undefined,
        patologias: [],
        observaciones: '',
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  // Observar el estado completo de familyMembers para detectar cambios
  const watchedFamilyMembers = watch('familyMembers');

  // Debug form state
  useEffect(() => {
    console.log("=== HeredoFamHistory Form Debug ===");
    console.log("Form errors:", errors);
    console.log("Form is valid:", isValid);
    console.log("Watched family members:", watchedFamilyMembers);
    console.log("===================================");
  }, [errors, isValid, watchedFamilyMembers]);

  // --- 5. Lógica de Carga de Datos ---
  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchHeredoFamilialHistory();
      loadAllActivePatologies();
    }
  }, [selectedPatient, user, authLoading]);

  const loadAllActivePatologies = async () => {
    try {
      const data = await api.patologies.getAllActive();
      
      // Convertir los datos de patologías al formato de AppPatology
      const formattedPatologies: AppPatology[] = data.map(patology => ({
        id: patology.id,
        nombre: patology.nombre,
      }));
      
      setGlobalSelectedCatalogPatologies(formattedPatologies);
    } catch (err) {
      console.error('Error loading all active pathologies:', err);
    }
  };

  const fetchHeredoFamilialHistory = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setError(null);

    try {
      // Cargar todos los registros heredo-familiares para este paciente
      const records = await api.heredoFamilialHistory.getAllByPatientId(selectedPatient.id);
      
      // Mapear los datos cargados a la estructura de familiares fijos
      const familyMembersData = FIXED_FAMILY_MEMBERS.map(fixedMember => {
        const existingRecord = records.find((record: any) => record.miembro_fam === fixedMember.key);
        
        // Lógica corregida para 'id':
        let memberId: string | undefined = undefined;
        if (existingRecord?.id !== null && existingRecord?.id !== undefined) {
          memberId = String(existingRecord.id);
        }

        return {
          id: memberId, // Usar el ID correctamente determinado
          miembro_fam_key: fixedMember.key,
          estado_vital: existingRecord?.estado_vital || '',
          edad: existingRecord?.edad || undefined,
          patologias: (existingRecord?.patologias || []) as HeredoFamilialPathology[],
          observaciones: existingRecord?.notas || '',
        };
      });

      reset({ familyMembers: familyMembersData });
    } catch (err) {
      console.error('Error fetching heredo familial history:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el historial heredo-familiar.');
    } finally {
      setLoading(false);
    }
  };

  // --- 6. Lógica de Drag and Drop ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverId(null);

    if (!over) return;

    // Verificar si se arrastró una patología del catálogo a un familiar
    if (
      active.data.current?.type === 'patology' &&
      over.data.current?.type === 'family-member'
    ) {
      const patology = active.data.current.patology as AppPatology;
      const familyMemberKey = over.data.current.familyMemberKey as string;
      
      // Encontrar el índice del familiar en el array del formulario
      const familyMemberIndex = fields.findIndex(
        field => field.miembro_fam_key === familyMemberKey
      );

      if (familyMemberIndex !== -1) {
        const currentPatologias = watch(`familyMembers.${familyMemberIndex}.patologias`) || [];
        
        // Verificar si la patología ya existe para evitar duplicados
        const alreadyExists = currentPatologias.some(
          (p: HeredoFamilialPathology) => p.nPatologia === patology.nombre
        );

        if (!alreadyExists) {
          const newPathology: HeredoFamilialPathology = {
            nPatologia: patology.nombre,
          };

          setValue(`familyMembers.${familyMemberIndex}.patologias`, [
            ...currentPatologias,
            newPathology,
          ]);
          
          console.log(`Added pathology "${patology.nombre}" to family member "${familyMemberKey}"`);
        } else {
          console.log(`Pathology "${patology.nombre}" already exists for family member "${familyMemberKey}"`);
        }
      }
    }
  };

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id || null);
  };

  // --- 7. Manejo del Catálogo Global ---
  const handleGlobalCatalogSelect = (patologyOrArray: AppPatology | AppPatology[]) => {
    if (Array.isArray(patologyOrArray)) {
      setGlobalSelectedCatalogPatologies(patologyOrArray);
    } else {
      const isAlreadySelected = globalSelectedCatalogPatologies.some(
        p => p.id === patologyOrArray.id
      );
      
      if (!isAlreadySelected) {
        setGlobalSelectedCatalogPatologies(prev => [...prev, patologyOrArray]);
      }
    }
  };

  const handleGlobalCatalogRemove = (patology: AppPatology) => {
    setGlobalSelectedCatalogPatologies(prev =>
      prev.filter(p => p.id !== patology.id)
    );
  };

  // --- 8. Manejo de Patologías en Familiares ---
  const removePathologyFromFamilyMember = (familyMemberIndex: number, pathologyIndex: number) => {
    const currentPatologias = watch(`familyMembers.${familyMemberIndex}.patologias`) || [];
    const updatedPatologias = currentPatologias.filter((_: any, index: number) => index !== pathologyIndex);
    setValue(`familyMembers.${familyMemberIndex}.patologias`, updatedPatologias);
  };

  // --- 9. Lógica de Envío del Formulario ---
  const onSubmit = async (data: HeredoFamilialFormData) => {
    console.log("=== onSubmit function called ===");
    console.log('Attempting to save HeredoFamilialHistory. Data:', data);
    console.log("Selected patient:", selectedPatient);
    console.log("User:", user);
    console.log("================================");
    
    if (!selectedPatient || !user) return;
    setSaving(true);
    setError(null);

    try {
      // Procesar cada familiar y guardar/actualizar sus datos
      for (const familyMember of data.familyMembers) {
        // Solo guardar si hay datos relevantes (estado vital o patologías)
        if (familyMember.estado_vital || familyMember.patologias.length > 0) {
          const payload = {
            ...(familyMember.id ? { id: familyMember.id } : {}),
            patient_id: selectedPatient.id,
            miembro_fam: familyMember.miembro_fam_key,
            estado_vital: familyMember.estado_vital || null,
            patologias: familyMember.patologias,
            notas: familyMember.observaciones || null,
            edad: familyMember.edad || null,
          };

          console.log('Saving family member data:', payload);
          await api.heredoFamilialHistory.createOrUpdate(payload);
        }
      }
      
      console.log('All family members saved successfully');
    } catch (err) {
      console.error('Error saving heredo familial history:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el historial heredo-familiar.');
    } finally {
      setSaving(false);
    }
  };

  // --- 10. Estilos ---
  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
  };

  // --- 11. Renderizado Condicional ---
  if (!selectedPatient) {
    return (
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={buttonStyle.base}
            style={buttonStyle.primary}
            onClick={() => {
              setShowWarningModal(false);
              navigate('/patients');
            }}
          >
            Entendido
          </button>
        }
      >
        <p>Por favor, seleccione un paciente primero desde la sección de Pacientes.</p>
      </Modal>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          {authLoading ? 'Autenticando...' : 'Cargando historial heredo-familiar...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Family className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes Heredo-Familiares
          </h1>
        </div>
      </div>

      <form id="heredo-fam-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        >        

          {/* Sección de Patologías Disponibles */}
          <div
            className="rounded-lg shadow-lg px-4 pt-2 pb-2 mb-0"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h2 
              className="text-lg font-medium mb-1 flex items-center gap-1"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fonts.headings,
              }}
            >
              Patologías Disponibles
              <span 
                className="px-2 py-1 text-sm rounded-full"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                }}
              >
                {globalSelectedCatalogPatologies.length}
              </span>
            </h2>
            <p 
              className="text-sm mb-1"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Arrastre las patologías desde aquí hacia la fila del familiar correspondiente
            </p>
            
            <div className="flex flex-wrap gap-1.5">
              {globalSelectedCatalogPatologies.map((patology) => (
                <DraggablePathologyTag
                  key={patology.id}
                  patology={patology}
                  onRemove={handleGlobalCatalogRemove}
                  isFromCatalog={true}
                />
              ))}
            </div>
          </div>

          {/* Tabla de Familiares */}
          <div
            className="rounded-lg shadow-lg overflow-hidden"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr
                    style={{
                      background: currentTheme.colors.background,
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    <th className="px-4 py-1 pt-1 pb-1 text-left text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                      Parentesco
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                      Estado Vital
                    </th>
                    <th className="px-4 py-1 text-left text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                      Edad
                    </th>
                    <th className="px-2 py-1 text-left text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                      Patologías
                    </th>
                    <th className="px-2 py-1 text-left text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
                  {fields.map((field, index) => {
                    const familyMember = FIXED_FAMILY_MEMBERS.find(m => m.key === field.miembro_fam_key);
                    const isDropTarget = overId === `family-${field.miembro_fam_key}`;
                    
                    return (
                      <DroppableFamilyRow
                        key={field.id}
                        familyMemberKey={field.miembro_fam_key}
                        isOver={isDropTarget}
                      >
                        {/* Parentesco */}
                        <td className="px-4 py-1">
                          <span
                            className="font-medium"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {familyMember?.label}
                          </span>
                        </td>

                        {/* Estado Vital */}
                        <td className="px-4 py-1">
                          <select
                            {...register(`familyMembers.${index}.estado_vital`)}
                            className="w-full p-2 text-sm rounded-md border"
                            style={{
                              background: currentTheme.colors.surface,
                              borderColor: currentTheme.colors.border,
                              color: currentTheme.colors.text,
                            }}
                          >
                            <option value="">Seleccione</option>
                            <option value="Vivo">Vivo</option>
                            <option value="Fallecido">Fallecido</option>
                            <option value="Desconocido">Desconocido</option>
                          </select>
                        </td>

                        {/* Edad */}
                        <td className="px-4 py-1">
                          <input
                            type="number"
                            {...register(`familyMembers.${index}.edad`, { valueAsNumber: true })}
                            placeholder="Edad"
                            className="w-16 p-2 text-sm rounded-md border"
                            style={{
                              background: currentTheme.colors.surface,
                              borderColor: currentTheme.colors.border,
                              color: currentTheme.colors.text,
                            }}
                          />
                        </td>

                        {/* Patologías */}
                        <td className="px-2 py-1">
                          <div
                            className={clsx(
                              'min-h-[30px] p-3 rounded-md border-2 border-dashed transition-colors',
                              isDropTarget ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                            )}
                            style={{
                              background: isDropTarget 
                                ? `${currentTheme.colors.primary}20` 
                                : currentTheme.colors.background,
                              borderColor: isDropTarget 
                                ? currentTheme.colors.primary 
                                : currentTheme.colors.border,
                            }}
                          >
                            {watch(`familyMembers.${index}.patologias`)?.length === 0 ? (
                              <p
                                className="text-xs text-center italic"
                                style={{ color: currentTheme.colors.textSecondary }}
                              >
                                {isDropTarget 
                                  ? 'Suelte aquí la patología' 
                                  : 'Arrastre patologías aquí'
                                }
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {watch(`familyMembers.${index}.patologias`)?.map((pathology: HeredoFamilialPathology, pathIndex: number) => (
                                  <div
                                    key={pathIndex}
                                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 border"
                                  >
                                    <span className="truncate max-w-[120px] font-bold">{pathology.nPatologia}</span>
                                    <button
                                      type="button"
                                      onClick={() => removePathologyFromFamilyMember(index, pathIndex)}
                                      className="p-0.5 rounded-full hover:bg-red-100 transition-colors"
                                    >
                                      <X className="h-4 w-4 text-red-500" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Observaciones */}
                        <td className="px-2 py-1">
                          <textarea
                            {...register(`familyMembers.${index}.observaciones`)}
                            placeholder="Observaciones"
                            rows={1}
                            className="w-full p-2 text-sm rounded-md border"
                            style={{
                              background: currentTheme.colors.surface,
                              borderColor: currentTheme.colors.border,
                              color: currentTheme.colors.text,
                            }}
                          />
                        </td>
                      </DroppableFamilyRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDragId ? (
              <div
                className="flex items-center gap-2 px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-800 border border-blue-300 shadow-lg"
              >
                <GripVertical className="h-3 w-3 opacity-50" />
                <span className="font-medium">
                  {globalSelectedCatalogPatologies.find(p => `patology-${p.id}` === activeDragId)?.nombre}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </form>

      {/* Instrucciones para el usuario */}
      <div
        className="rounded-lg p-4 text-sm"
        style={{
          background: `${currentTheme.colors.primary}10`,
          color: currentTheme.colors.textSecondary,
        }}
      >
        <p className="font-medium mb-1">Instrucciones:</p>
        <ul className="space-y-1 text-xs">
          <li>1. Arrastre las patologías desde la sección "Patologías Disponibles" hacia la fila del familiar correspondiente</li>
          <li>2. Las patologías se añadirán automáticamente al familiar cuando las suelte en su fila</li>
          <li>3. Complete el estado vital, edad y observaciones para cada familiar según corresponda</li>
          <li>4. Haga clic en "Guardar" para guardar todos los cambios</li>
        </ul>
      </div>
    </div>
  );
}