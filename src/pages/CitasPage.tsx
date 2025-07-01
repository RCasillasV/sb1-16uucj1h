import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, Info, HelpCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import { supabase } from '../lib/supabase'; // Importar supabase

const SINTOMAS_PREDEFINIDOS = [
  'Fiebre',
  'Llanto inconsolable',
  'Rechazo al seno/biberón',
  'Vómitos',
  'Diarrea',
  'Congestión nasal',
  'Tos',
  'Erupción en piel',
  'Somnolencia excesiva',
  'Irritabilidad',
  'Estreñimiento',
  'Regurgitaciones frecuentes',
  'Sibilancias',
  'Secreción ocular',
  'Dificultad para dormir',
  'Estornudos repetitivos',
  'Hipo persistente',
  'Movimientos anormales',
  'Fontanela abombada',
  'Palidez cutánea'
];

const HORARIOS_CONSULTA = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minutes = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

const formSchema = z.object({
  tipo_consulta: z.enum(['primera', 'seguimiento', 'urgencia', 'control']),
  motivo: z.string().min(2, { message: "El motivo es requerido" }),
  tiempo_evolucion: z.string().min(1, { message: "El tiempo de evolución es requerido" }),
  unidad_tiempo: z.enum(['horas', 'dias', 'semanas', 'meses']),
  sintomas_asociados: z.array(z.string()).default([]),
  fecha_cita: z.string().min(1, { message: "La fecha es requerida" }),
  hora_cita: z.string().min(1, { message: "La hora es requerida" }),
  consultorio: z.number().min(1).max(3),
  urgente: z.boolean().default(false),
  mismo_motivo: z.boolean().default(false), // This field is for UI logic, not directly for DB
  notas: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CitasPage() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [showDateTimeErrorModal, setShowDateTimeErrorModal] = useState(false);

  // Obtener datos del estado de navegación si vienen de Agenda
  const navigationState = location.state as {
    selectedDate?: Date;
    editMode?: boolean;
    appointmentId?: string;
    selectedPatient?: any;
  } | null;

  // Configurar fecha inicial basada en la navegación
  const initialDate = navigationState?.selectedDate 
    ? format(new Date(navigationState.selectedDate), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');

  // Configurar hora inicial basada en la navegación
  const initialTime = navigationState?.selectedDate 
    ? format(new Date(navigationState.selectedDate), 'HH:mm')
    : '09:00';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_consulta: 'primera',
      motivo: '',
      tiempo_evolucion: '',
      unidad_tiempo: 'dias',
      sintomas_asociados: [],
      fecha_cita: initialDate,
      hora_cita: initialTime,
      consultorio: 1,
      urgente: false,
      mismo_motivo: false,
      notas: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!selectedPatient) return;
    
    // Validar que la fecha y hora sean futuras
    const selectedDateTime = new Date(`${data.fecha_cita}T${data.hora_cita}:00`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      setShowDateTimeErrorModal(true);
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      await api.appointments.create({
        id_paciente: selectedPatient.id, // Changed from patient_id to id_paciente
        fecha_cita: data.fecha_cita, // Changed from appointment_date to fecha_cita
        hora_cita: data.hora_cita, // New field
        motivo: data.motivo, // Changed from reason to motivo
        estado: 'programada', // Changed from status to estado, and 'scheduled' to 'programada'
        consultorio: data.consultorio, // Changed from cubicle to consultorio
        notas: data.notas || null, // Changed from notes to notas
        tipo_consulta: data.tipo_consulta,
        tiempo_evolucion: parseInt(data.tiempo_evolucion),
        unidad_tiempo: data.unidad_tiempo,
        sintomas_asociados: data.sintomas_asociados,
        urgente: data.urgente,
        id_user: userId, // Added id_user
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/agenda/agenda');
      }, 2000);
    } catch (error) {
      console.error('Error creating appointment:', error);
      form.setError('root', { message: 'Error al crear la cita' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymptom = () => {
    if (!customSymptom.trim()) return;
    
    const currentSymptoms = form.getValues('sintomas_asociados');
    if (!currentSymptoms.includes(customSymptom)) {
      form.setValue('sintomas_asociados', [...currentSymptoms, customSymptom]);
    }
    setCustomSymptom('');
  };

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

  if (!selectedPatient) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg mb-4">Por favor seleccione un paciente primero</p>
        <button
          onClick={() => navigate('/patients')}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          Ir a Pacientes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div 
          className="p-4 border-b"
          style={{ 
            background: `${currentTheme.colors.primary}10`,
            borderColor: currentTheme.colors.border,
          }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: currentTheme.colors.text }}
              >
                {navigationState?.editMode ? 'Editar Cita Médica' : 'Agendar Consulta Médica'}
              </h1>
              <p 
                className="text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {selectedPatient.Nombre} {selectedPatient.Paterno} {selectedPatient.Materno}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div 
              className="p-4 rounded-md"
              style={{ 
                background: '#DEF7EC',
                color: '#03543F',
              }}
            >
              Cita agendada exitosamente. Redirigiendo...
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Tipo de Consulta */}
              <div>
                <label 
                  className="block text-base font-medium mb-1"
                  style={{ color: currentTheme.colors.text }}
                >
                  Tipo de Consulta
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'primera', label: 'Primera vez' },
                    { value: 'seguimiento', label: 'Seguimiento' },
                    { value: 'urgencia', label: 'Urgencia' },
                    { value: 'control', label: 'Control rutinario' },
                  ].map(option => (
                    <label 
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        {...form.register('tipo_consulta')}
                        value={option.value}
                        className="rounded-full border-gray-300"
                      />
                      <span style={{ color: currentTheme.colors.text }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Motivo Principal y Tiempo de Evolución */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Motivo Principal
                  </label>
                  <input
                    type="text"
                    {...form.register('motivo')}
                    placeholder="Ej: Dolor de cabeza, Fiebre"
                    className="w-full p-2 rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Tiempo de Evolución
                    </label>
                    <input
                      type="number"
                      {...form.register('tiempo_evolucion')}
                      placeholder="Ej: 2"
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Unidad
                    </label>
                    <select
                      {...form.register('unidad_tiempo')}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      <option value="horas">Horas</option>
                      <option value="dias">Días</option>
                      <option value="semanas">Semanas</option>
                      <option value="meses">Meses</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Síntomas Asociados */}
              <div>
                <label 
                  className="block text-base font-medium mb-2"
                  style={{ color: currentTheme.colors.text }}
                >
                  Síntomas Asociados
                </label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {SINTOMAS_PREDEFINIDOS.map(sintoma => {
                      const isSelected = form.watch('sintomas_asociados').includes(sintoma);
                      return (
                        <button
                          key={sintoma}
                          type="button"
                          onClick={() => {
                            const current = form.getValues('sintomas_asociados');
                            if (isSelected) {
                              form.setValue('sintomas_asociados', 
                                current.filter(s => s !== sintoma)
                              );
                            } else {
                              form.setValue('sintomas_asociados', [...current, sintoma]);
                            }
                          }}
                          className={clsx(
                            'px-3 py-1 rounded-md text-sm transition-colors border',
                            isSelected && 'bg-slate-800 text-white border-slate-900',
                            !isSelected && 'bg-white hover:bg-slate-50 border-slate-200'
                          )}
                          style={{
                            color: isSelected ? '#fff' : currentTheme.colors.text,
                          }}
                        >
                          {sintoma}
                        </button>
                      );
                    })}

                    {/* Mostrar síntomas personalizados agregados */}
                    {form.watch('sintomas_asociados')
                      ?.filter(
                        (id) =>
                          !SINTOMAS_PREDEFINIDOS.includes(id),
                      )
                      .map((customTag) => (
                        <div
                          key={customTag}
                          className="flex items-center bg-slate-800 text-white px-2 py-0.5 rounded-md text-xs font-medium border border-slate-900"
                        >
                          {customTag}
                          <button
                            type="button"
                            className="ml-1 text-white hover:text-slate-200"
                            onClick={() => {
                              form.setValue('sintomas_asociados', form.getValues('sintomas_asociados')?.filter((id) => id !== customTag));
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="Agregar otro síntoma"
                      className="flex-1 p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.currentTarget.value.trim()) {
                            const newTag = e.currentTarget.value.trim()
                            if (newTag && !form.getValues('sintomas_asociados')?.includes(newTag)) {
                              form.setValue('sintomas_asociados', [...(form.getValues('sintomas_asociados') || []), newTag]);
                              setCustomSymptom('');;
                            }
                          }
                        }
                      }}
                    />                
                  </div>
                </div>
              </div>

              {/* Agenda de Citas */}
              <div>
                <h3 
                  className="text-base font-medium mb-2"
                  style={{ color: currentTheme.colors.text }}
                >
                  Agenda de Citas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Fecha
                    </label>
                    <input
                      type="date"
                      {...form.register('fecha_cita')}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Hora
                    </label>
                    <select
                      {...form.register('hora_cita')}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      {HORARIOS_CONSULTA.map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Consultorio
                    </label>
                    <select
                      {...form.register('consultorio', { valueAsNumber: true })}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      <option value={1}>Consultorio 1</option>
                      <option value={2}>Consultorio 2</option>
                      <option value={3}>Consultorio 3</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className={clsx(buttonStyle.base, 'border')}
                  style={{
                    background: 'transparent',
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(buttonStyle.base, 'disabled:opacity-50')}
                  style={buttonStyle.primary}
                >
                  {loading ? 'Guardando...' : navigationState?.editMode ? 'Actualizar Cita' : 'Agendar Consulta'}
                </button>
              </div>
            </form>
          )}

          {/* Modal de error de fecha/hora */}
          <Modal
            isOpen={showDateTimeErrorModal}
            onClose={() => setShowDateTimeErrorModal(false)}
            title="Fecha y Hora No Válidas"
            actions={
              <button
                onClick={() => setShowDateTimeErrorModal(false)}
                className={buttonStyle.base}
                style={buttonStyle.primary}
              >
                Aceptar
              </button>
            }
          >
            <div className="flex items-start gap-3">
              <AlertTriangle 
                className="h-6 w-6 mt-1 flex-shrink-0" 
                style={{ color: '#F59E0B' }} 
              />
              <div>
                <p className="mb-2" style={{ color: currentTheme.colors.text }}>
                  No es posible agendar citas para fechas y horas anteriores al momento actual.
                </p>
                <p style={{ color: currentTheme.colors.textSecondary }}>
                  Por favor, seleccione una fecha y hora futura.
                </p>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}