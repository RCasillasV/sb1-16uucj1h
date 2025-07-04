import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isBefore, parseISO, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, Info, HelpCircle, AlertTriangle, Phone } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

// ... (otras definiciones y constantes)

const HORARIOS_CONSULTA = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

const formSchema = z.object({
  tipo_consulta: z.enum(['primera', 'seguimiento', 'urgencia','revision', 'control']),
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
  duracion_minutos: z.number().refine(val => [15, 20, 30, 40, 60].includes(val), { // Nuevo campo
    message: "La duración debe ser 15, 20, 30, 40 o 60 minutos."
  }),
  hora_fin: z.string(), // Nuevo campo
});

type FormData = z.infer<typeof formSchema>;

export function CitasPage() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const [dynamicSymptoms, setDynamicSymptoms] = useState<string[]>([]);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [showDateTimeErrorModal, setShowDateTimeErrorModal] = useState(false);
  const [hasPreviousAppointments, setHasPreviousAppointments] = useState(false); // Nuevo estado
  const [showPhoneModal, setShowPhoneModal] = useState(false); // Nuevo estado para el modal de teléfono

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
      duracion_minutos: 30, // Default duration
      hora_fin: '', // Will be calculated
    },
  });

  // Effect to check for previous appointments
  useEffect(() => {
    const checkPreviousAppointments = async () => {
      if (!selectedPatient) {
        setHasPreviousAppointments(false);
        return;
      }
      try {
        const patientAppointments = await api.appointments.getByPatientId(selectedPatient.id);
        const now = new Date();
        const previous = patientAppointments.some(app => {
          const appDateTime = parseISO(`${app.fecha_cita}T${app.hora_cita}`);
          return isBefore(appDateTime, now);
        });
        setHasPreviousAppointments(previous);
        if (previous && form.getValues('tipo_consulta') === 'primera') {
          form.setValue('tipo_consulta', 'seguimiento');
        }
      } catch (error) {
        console.error('Error checking previous appointments:', error);
        setHasPreviousAppointments(false);
      }
    };

    checkPreviousAppointments();
  }, [selectedPatient, form]);

  // Effect to calculate hora_fin
  useEffect(() => {
    const { fecha_cita, hora_cita, duracion_minutos } = form.getValues();
    if (fecha_cita && hora_cita && duracion_minutos) {
      try {
        const startDateTime = parseISO(`${fecha_cita}T${hora_cita}`);
        const endDateTime = addMinutes(startDateTime, duracion_minutos);
        form.setValue('hora_fin', format(endDateTime, 'HH:mm'));
      } catch (e) {
        console.error('Error calculating end time:', e);
        form.setValue('hora_fin', '');
      }
    } else {
      form.setValue('hora_fin', '');
    }
  }, [form.watch('fecha_cita'), form.watch('hora_cita'), form.watch('duracion_minutos')]);


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
        id_paciente: selectedPatient.id,
        fecha_cita: data.fecha_cita,
        hora_cita: data.hora_cita,
        motivo: data.motivo,
        estado: 'programada',
        consultorio: data.consultorio,
        notas: data.notas || null,
        tipo_consulta: data.tipo_consulta,
        tiempo_evolucion: parseInt(data.tiempo_evolucion),
        unidad_tiempo: data.unidad_tiempo,
        sintomas_asociados: data.sintomas_asociados,
        urgente: data.urgente,
        id_user: userId,
        duracion_minutos: data.duracion_minutos, // Nuevo campo
        hora_fin: data.hora_fin, // Nuevo campo
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

  // Fetch symptoms based on patient age
  useEffect(() => {
    if (!selectedPatient || !selectedPatient.FechaNacimiento) return;
    
    const fetchSymptoms = async () => {
      setIsLoadingSymptoms(true);
      setSymptomsError(null); // api.appointments.create
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setSymptomsError('Usuario no autenticado');
          setIsLoadingSymptoms(false);
          return;
        }

        const { data: userData, error: userError } = await supabase.rpc('get_user_idbu', {
          user_id: session.user.id
        });

        if (userError || !userData?.idbu) {
          setSymptomsError('No se pudo obtener la unidad de negocio del usuario');
          setIsLoadingSymptoms(false);
          return;
        }

        const specialty = await api.businessUnits.getById(userData.idbu);
        if (!specialty) {
          setSymptomsError('No se pudo obtener la especialidad de la unidad de negocio');
          setIsLoadingSymptoms(false);
          return;
        }

        const { data, error } = await supabase.rpc('sintomasconsulta', { 
          p_fechanac: format(new Date(selectedPatient.FechaNacimiento), 'yyyy/MM/dd'), 
          p_especialidad: specialty
        });    
        
        if (error) throw error;
        setDynamicSymptoms(data || []);
      } catch (error) {
        console.error('Error fetching symptoms:', error);
        setSymptomsError('No se pudieron cargar los síntomas');
        setDynamicSymptoms([]);
      } finally {
        setIsLoadingSymptoms(false);
      }
    };
    
    fetchSymptoms();
  }, [selectedPatient]);

  const handleAddSymptom = () => {
    if (!customSymptom.trim()) return;
    
    const currentValue = form.getValues('sintomas_asociados') || [];
    if (!currentValue.includes(customSymptom)) {
      form.setValue('sintomas_asociados', [...currentValue, customSymptom]);
      setCustomSymptom('');
    }
  };

  const buttonStyle = {
    base: clsx(
      'px-3 py-1 transition-colors',
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
                  {/* Conditionally render "Primera vez" */}
                  {!hasPreviousAppointments && (
                    <label 
                      key="primera"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        {...form.register('tipo_consulta')}
                        value="primera"
                        className="rounded-full border-gray-300"
                      />
                      <span style={{ color: currentTheme.colors.text }}>
                        Primera vez
                      </span>
                    </label>
                  )}
                  {[
                    { value: 'seguimiento', label: 'Seguimiento' },
                    { value: 'control', label: 'Control rutinario' },
                    { value: 'revision', label: 'Revisión'},
                    { value: 'urgencia', label: 'Urgencia' },
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
                    required placeholder="Ej: Dolor de cabeza, Fiebre, Malestar general"
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
                    {/* Use dynamicSymptoms here */}
                    {dynamicSymptoms.map(sintoma => {
                       const isSelected = form.watch('sintomas_asociados').includes(sintoma.nombre);
                      return (
                        <button
                          key={sintoma.nombre} 
                          type="button"
                          onClick={() => {
                            const current = form.getValues('sintomas_asociados');
                            if (isSelected) {
                              form.setValue('sintomas_asociados', 
                                current.filter(s => s !== sintoma.nombre)
                              );
                            } else {
                              form.setValue('sintomas_asociados', [...current, sintoma.nombre]);
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
                          {sintoma.nombre}
                        </button>
                      ); 
                    })}

                    {/* Mostrar síntomas personalizados agregados */}
                    {form.watch('sintomas_asociados')
                      ?.filter(
                        (id) =>
                         !dynamicSymptoms.some(sintoma => sintoma.nombre === id),
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

                  {/* Nueva columna: Duración estimada */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Duración minutos
                    </label>
                    <select
                      {...form.register('duracion_minutos', { valueAsNumber: true })}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={40}>40 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>

                  {/* Nueva columna: Hora final */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Hora final
                    </label>
                    <input
                      type="text"
                      {...form.register('hora_fin')}
                      readOnly
                      className="w-full p-2 rounded-md border bg-gray-100 cursor-not-allowed"
                      style={{
                        background: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    />
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
                  {loading ? 'Guardando...' : navigationState?.editMode ? 'Actualizar' : 'Agendar'}
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
      {/* Modal para mostrar el teléfono del paciente */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        title="Teléfono del Paciente"
        actions={
          <button
            onClick={() => setShowPhoneModal(false)}
            className={buttonStyle.base}
            style={buttonStyle.primary} 
          >
            Cerrar
          </button>
        }
      >
        <p className="text-lg font-medium" style={{ color: currentTheme.colors.text }}>
          {selectedPatient.Telefono ? selectedPatient.Telefono : 'No hay número de teléfono registrado.'}
        </p>
      </Modal>
    </div>
  );
}
