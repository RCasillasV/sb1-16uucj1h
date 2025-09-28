import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, addMinutes, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Info, HelpCircle, AlertTriangle, Phone } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAgenda } from '../contexts/AgendaContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';
 
// Interface for symptom objects
interface Symptom {
  sintoma: string; // CAMBIO: De 'nombre' a 'sintoma'
  frecuencia: number; // CAMBIO: Añadida la propiedad 'frecuencia'
}

// Function to generate time slots
const generateSchedule = (startTime: string, endTime: string, intervalMinutes: number) => {
  const times = [];
  
  const start = new Date(`2000/01/01 ${startTime}`);
  const end = new Date(`2000/01/01 ${endTime}`);
  let currentTime = new Date(start);
  while (currentTime <= end) {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    times.push(`${hours}:${minutes}`);
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
  }
  
  return times;
};

const formSchema = z.object({
  tipo_consulta: z.enum(['primera', 'seguimiento', 'urgencia','revision', 'control']),
  motivo: z.string().min(2, { message: "El motivo de la cita es requerido" }),
  tiempo_evolucion: z.string().nullable().optional(),
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
  hora_fin: z.string(),
  estado: z.number().default(1), // Agregar campo estado como número
});

// Componente para el selector de estado
interface EstadoSelectorProps {
  value: number;
  onChange: (estadoId: number) => void;
  disabled?: boolean;
}

function EstadoSelector({ value, onChange, disabled = false }: EstadoSelectorProps) {
  const { currentTheme } = useTheme();
  const [estados, setEstados] = useState<Array<{ id: number; estado: string; descripcion: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const estadosData = await api.appointments.getEstados();
        setEstados(estadosData);
      } catch (error) {
        console.error('Error fetching estados:', error);
        // Fallback a los estados por defecto
        setEstados([
          { id: 1, estado: 'Programada', descripcion: 'Cita programada' },
          { id: 2, estado: 'Confirmada', descripcion: 'Cita confirmada' },
          { id: 3, estado: 'En Progreso', descripcion: 'Cita en progreso' },
          { id: 4, estado: 'Atendida', descripcion: 'Cita completada' },
          { id: 5, estado: 'Cancelada', descripcion: 'Cita cancelada' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEstados();
  }, []);

  if (loading) {
    return (
      <select 
        disabled 
        className="w-full p-2 rounded-md border"
        style={{
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
          color: currentTheme.colors.textSecondary,
        }}
      >
        <option>Cargando...</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className="w-full p-2 rounded-md border"
      style={{
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
        color: currentTheme.colors.text,
      }}
    >
      {estados.map(estado => (
        <option key={estado.id} value={estado.id}>
          {estado.estado}
        </option>
      ))}
    </select>
  );
}

export function CitasPage() {
  const { currentTheme } = useTheme();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('CitasPage: navigationState al renderizar:', location.state);

  // Obtener datos del estado de navegación si vienen de Agenda
  const navigationState = location.state as {
    selectedDate?: Date;
    editMode?: boolean;
    appointmentId?: string;
    selectedPatient?: any;
    viewOnly?: boolean;
  } | null;

  // Determinar el paciente para esta página. Priorizar el estado de navegación, luego el contexto.
  const patientForForm = navigationState?.selectedPatient || selectedPatient;

  // Calcular valores iniciales directamente antes de useForm
  const selectedDateFromNav = navigationState?.selectedDate;
  const initialDateValue = selectedDateFromNav
    ? format(new Date(selectedDateFromNav), 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd');
  const initialTimeValue = selectedDateFromNav
    ? format(new Date(selectedDateFromNav), 'HH:mm')
    : '09:00';

  // Acceder a la configuración de la agenda
  const { agendaSettings, loading: agendaLoading } = useAgenda();

  // Estado para modo de solo lectura
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(navigationState?.viewOnly || false);

  // Initialize form with directly calculated values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_consulta: 'primera',
      motivo: '',
      tiempo_evolucion: '',
      unidad_tiempo: 'dias',
      sintomas_asociados: [],
      fecha_cita: initialDateValue,
      hora_cita: initialTimeValue,
      consultorio: 1,
      urgente: false,
      mismo_motivo: false,
      notas: '',
      duracion_minutos: 30,
      hora_fin: '',
    },
  });

  const [dynamicSymptoms, setDynamicSymptoms] = useState<Symptom[]>([]);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');
  const [showDateTimeErrorModal, setShowDateTimeErrorModal] = useState(false);
  const [hasPreviousAppointments, setHasPreviousAppointments] = useState(false); // Nuevo estado
  const [showPhoneModal, setShowPhoneModal] = useState(false); // Nuevo estado para el modal de teléfono
  // New state for active consultorios
  const [activeConsultorios, setActiveConsultorios] = useState<Array<{ id: number; consultorio: string; activo: boolean; }>>([]);

  // Estado para citas en la fecha seleccionada
  const [appointmentsOnSelectedDate, setAppointmentsOnSelectedDate] = useState<any[]>([]);
  const [loadingAvailableSlots, setLoadingAvailableSlots] = useState(false);

  // Estado para edición de citas
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);

  // Cache para evitar múltiples llamadas a get_user_idbu
  const cachedUserDataRef = useRef<{ idbu: string; specialty: string } | null>(null);
  const cacheTimestampRef = useRef(0);
  const CACHE_DURATION = 25 * 60 * 1000; // 25 minutos
  
  // Generar HORARIOS_CONSULTA dinámicamente
  const HORARIOS_CONSULTA = useMemo(() => {
    if (!agendaSettings) {
      return []; // Retorna un array vacío si la configuración no está cargada
    }
    // Asegúrate de que start_time y end_time estén en formato HH:MM
    const startTime = agendaSettings.start_time.substring(0, 5);
    const endTime = agendaSettings.end_time.substring(0, 5);
    const interval = agendaSettings.slot_interval;
    return generateSchedule(startTime, endTime, interval);
  }, [agendaSettings]);

  // Cache para evitar múltiples llamadas a get_user_idbu
  let cachedUserData: { idbu: string; specialty: string } | null = null;

  // useEffect to fetch active consultorios
  useEffect(() => {
    const fetchConsultorios = async () => {
      try {
        const consultoriosData = await api.consultorios.getAll();
        const active = consultoriosData.filter(c => c.activo);
        setActiveConsultorios(active);
        // Set default consultorio if none is selected or if the selected one is inactive
        if (active.length > 0 && (!form.getValues('consultorio') || !active.some(c => c.id === form.getValues('consultorio')))) {
          form.setValue('consultorio', active[0].id);
        }
      } catch (error) {
        console.error('Error fetching consultorios:', error);
      }
    };
    fetchConsultorios(); // Se ejecuta una vez al montar el componente
  }, []); 

  // useEffect para cargar datos de cita en modo edición
  useEffect(() => {
    const loadAppointment = async () => {
      console.log('CitasPage: useEffect - navigationState:', navigationState);
      console.log('CitasPage: useEffect - navigationState:', navigationState);
      if (navigationState?.editMode && navigationState?.appointmentId) {
        setLoadingAppointment(true);
        console.log('CitasPage: Fetching appointment with ID:', navigationState.appointmentId);
        console.log('CitasPage: Fetching appointment with ID:', navigationState.appointmentId);
        try {
          const fetchedAppointment = await api.appointments.getById(navigationState.appointmentId);
          if (fetchedAppointment) {
            setEditingAppointment(fetchedAppointment);
            
            // Formatear hora_cita a HH:MM si viene en formato HH:MM:SS
            const formattedHoraCita = fetchedAppointment.hora_cita.includes(':') 
              ? fetchedAppointment.hora_cita.substring(0, 5) 
              : fetchedAppointment.hora_cita;
            console.log('CitasPage: Fetched Appointment hora_cita (formatted):', formattedHoraCita);
            
            // Formatear hora_fin si existe
            const formattedHoraFin = fetchedAppointment.hora_fin 
              ? (fetchedAppointment.hora_fin.includes(':') 
                  ? fetchedAppointment.hora_fin.substring(0, 5) 
                  : fetchedAppointment.hora_fin)
              : '';
            
            // Precargar el formulario con los datos de la cita
            form.reset({
              tipo_consulta: fetchedAppointment.tipo_consulta,
              motivo: fetchedAppointment.motivo,
              tiempo_evolucion: fetchedAppointment.tiempo_evolucion?.toString() || '',
              unidad_tiempo: fetchedAppointment.unidad_tiempo || 'dias',
              sintomas_asociados: fetchedAppointment.sintomas_asociados || [],
              fecha_cita: fetchedAppointment.fecha_cita,
              hora_cita: formattedHoraCita,
              consultorio: fetchedAppointment.consultorio,
              urgente: fetchedAppointment.urgente,
              mismo_motivo: false,
              notas: fetchedAppointment.notas || '',
              duracion_minutos: fetchedAppointment.duracion_minutos || 30,
              hora_fin: formattedHoraFin,
              estado: fetchedAppointment.estado || 1,
            });
            console.log('CitasPage: Fetched Appointment hora_cita (formatted):', formattedHoraCita);
            console.log('CitasPage: Form values after reset:', form.getValues());
            
            // Establecer el paciente seleccionado
            if (fetchedAppointment.patients) {
              setSelectedPatient(fetchedAppointment.patients);
            }
            
            // Verificar si la cita es pasada y establecer modo de solo lectura
            const appointmentDateTime = parseISO(`${fetchedAppointment.fecha_cita}T${fetchedAppointment.hora_cita}`);
            const now = new Date();
            if (isBefore(appointmentDateTime, now)) {
              setIsViewOnlyMode(true);
            }
          }
        } catch (err) {
          console.error('CitasPage: Error loading appointment for editing:', err);
          form.setError('root', { 
            message: 'Error al cargar los datos de la cita' 
          });
        } finally {
          setLoadingAppointment(false);
        }
      }
    };
    
    loadAppointment();
  }, [navigationState?.editMode, navigationState?.appointmentId, form, setSelectedPatient]);

  // Efecto para actualizar el selectedPatient del contexto si viene del estado de navegación
  useEffect(() => {
    if (navigationState?.selectedPatient && navigationState.selectedPatient !== selectedPatient) {
      setSelectedPatient(navigationState.selectedPatient);
    }
  }, [navigationState?.selectedPatient, selectedPatient, setSelectedPatient]);
  
  // Effect to check for previous appointments
  useEffect(() => {
    const checkPreviousAppointments = async () => {
      if (!selectedPatient || editingAppointment) {
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
  }, [selectedPatient, form, editingAppointment]);

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

  // Effect to fetch appointments for selected date and consultorio
  useEffect(() => {
    const fetchAppointmentsForDate = async () => {
      const fecha = form.watch('fecha_cita');
      const consultorio = form.watch('consultorio');
      
      if (!fecha || !consultorio) return;
      
      setLoadingAvailableSlots(true);
      try {
        const appointments = await api.appointments.getByDateAndConsultorio(fecha, consultorio);
        setAppointmentsOnSelectedDate(appointments);
      } catch (error) {
        console.error('Error fetching appointments for date:', error);
        setAppointmentsOnSelectedDate([]);
      } finally {
        setLoadingAvailableSlots(false);
      }
    };

    fetchAppointmentsForDate();
  }, [form.watch('fecha_cita'), form.watch('consultorio')]);

  // Function to check if a time slot is available
  const isTimeSlotAvailable = (timeSlot: string, duration: number): boolean => {
    const selectedDateStr = form.watch('fecha_cita'); // Obtener la fecha seleccionada del formulario
    const today = new Date(); // Obtener la fecha y hora actuales
    const todayStr = format(today, 'yyyy-MM-dd'); // Formatear la fecha actual a string

    // Crear un objeto Date para el inicio del slot actual usando la fecha seleccionada real
    const currentSlotDateTime = new Date(`${selectedDateStr}T${timeSlot}:00`);

    // NUEVA LÓGICA: Si la fecha seleccionada es hoy, verificar si el slot está en el pasado
    if (selectedDateStr === todayStr) {
      if (currentSlotDateTime < today) { // Comparar con la hora actual real
        console.log(`Slot ${timeSlot} en ${selectedDateStr} está en el pasado respecto a ${format(today, 'HH:mm')}.`);
        return false; // El slot está en el pasado, por lo tanto no está disponible
      }
    }

    // Para las comprobaciones de superposición con otras citas, seguimos usando una fecha ficticia
    // Esto simplifica las comparaciones de tiempo puro y evita problemas con los cambios de día.
    const dummyDate = '2000-01-01'; // Fecha ficticia consistente para todas las comparaciones de tiempo
    const fixedTimeComparisonDate = '2000-01-01';
    const slotStart = parseISO(`${fixedTimeComparisonDate}T${timeSlot}:00`);
    const slotEnd = addMinutes(slotStart, duration);
    
    return !appointmentsOnSelectedDate.some(appointment => {
      // Saltar la cita que se está editando
      if (editingAppointment && appointment.id === editingAppointment.id) {
        return false;
      }
      
      // Formatear hora_cita y hora_fin a HH:MM antes de usarlas
     const formattedAppointmentHoraCita = appointment.hora_cita.substring(0, 5);
     const appointmentStart = parseISO(`${fixedTimeComparisonDate}T${formattedAppointmentHoraCita}`);

      let formattedAppointmentHoraFin = appointment.hora_fin;
      if (formattedAppointmentHoraFin) {
        formattedAppointmentHoraFin = formattedAppointmentHoraFin.substring(0, 5);
      }
    const appointmentEnd = formattedAppointmentHoraFin
      ? parseISO(`${fixedTimeComparisonDate}T${formattedAppointmentHoraFin}`)
      : addMinutes(appointmentStart, appointment.duracion_minutos || 30);

      // Logs de depuración para la lógica de superposición
      console.log('--- Comprobando Slot para Superposición ---');
      console.log('Slot:', timeSlot, 'Duración:', duration);
      console.log('Inicio del Slot (fecha ficticia):', slotStart.toISOString());
      console.log('Fin del Slot (fecha ficticia):', slotEnd.toISOString());
      console.log('Cita:', appointment.motivo, 'ID:', appointment.id);
      console.log('Inicio de Cita (fecha ficticia):', appointmentStart.toISOString());
      console.log('Fin de Cita (fecha ficticia):', appointmentEnd.toISOString());
      console.log('appointment.hora_cita (original):', appointment.hora_cita);
      console.log('appointment.hora_cita (formateada):', formattedAppointmentHoraCita);
      console.log('appointment.hora_fin (original):', appointment.hora_fin);
      console.log('appointment.hora_fin (formateada):', formattedAppointmentHoraFin);
      console.log('¿appointmentStart es una fecha válida?', !isNaN(appointmentStart.getTime()));
      console.log('¿appointmentEnd es una fecha válida?', !isNaN(appointmentEnd.getTime()));

      const overlaps = (slotStart < appointmentEnd && slotEnd > appointmentStart);
      console.log('Superposición:', overlaps);
      console.log('---------------------');

      // Comprobar superposición
      return overlaps;
    });
  };

  // Note: We now show all time slots and mark unavailable ones as disabled
  // instead of filtering them out completely


  const onSubmit = async (data: FormData) => {
    if (!selectedPatient) return;
    
    // Validar que la fecha y hora sean futuras
    const selectedDateTime = new Date(`${data.fecha_cita}T${data.hora_cita}:00`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      setShowDateTimeErrorModal(true);
      return;
    }
    
    // Validar que el horario seleccionado sigue siendo válido
    // Solo validar disponibilidad para nuevas citas, no para ediciones
    if (!editingAppointment && !isTimeSlotAvailable(data.hora_cita, data.duracion_minutos)) {
      form.setError('hora_cita', { 
        message: 'El horario seleccionado ya no está disponible. Por favor, seleccione otro horario.' 
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      if (editingAppointment) {
        // Update existing appointment
        await api.appointments.update(editingAppointment.id, {
          fecha_cita: data.fecha_cita,
          hora_cita: data.hora_cita,
          motivo: data.motivo,
          estado: data.estado,
          consultorio: data.consultorio,
          notas: data.notas || null,
          tipo_consulta: data.tipo_consulta,
          tiempo_evolucion: parseInt(data.tiempo_evolucion || '0'),
          unidad_tiempo: data.unidad_tiempo,
          sintomas_asociados: data.sintomas_asociados,
          urgente: data.urgente,
          duracion_minutos: data.duracion_minutos,
          hora_fin: data.hora_fin,
        });
      } else {
        // Create new appointment
        await api.appointments.create({
          id_paciente: selectedPatient.id,
          fecha_cita: data.fecha_cita,
          hora_cita: data.hora_cita,
          motivo: data.motivo,
          estado: 1, // ID para 'Programada'
          consultorio: data.consultorio,
          notas: data.notas || null,
          tipo_consulta: data.tipo_consulta,
          tiempo_evolucion: parseInt(data.tiempo_evolucion || '0'),
          unidad_tiempo: data.unidad_tiempo,
          sintomas_asociados: data.sintomas_asociados,
          urgente: data.urgente,
          id_user: userId,
          duracion_minutos: data.duracion_minutos,
          hora_fin: data.hora_fin,
        });
      }

      setSuccess(true);
      const successTimer = setTimeout(() => { 
        navigate('/agenda/agenda');
      }, 2000);
      
      // Cleanup function is handled by component unmounting
      return () => {
        clearTimeout(successTimer);
      };
    } catch (error) {
      console.error('Error creating appointment:', error);
      form.setError('root', { 
        message: editingAppointment ? 'Error al actualizar la cita' : 'Error al crear la cita' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch symptoms based on patient age
  useEffect(() => {
    if (!selectedPatient || !selectedPatient.FechaNacimiento) {
      console.log('fetchSymptoms: No selected patient or birth date.');
      setDynamicSymptoms([]); // Clear symptoms if no patient selected
      return;
    }
    
    const fetchSymptoms = async () => {
      setIsLoadingSymptoms(true);
      setSymptomsError(null);
      
      try {
        // Verificar cache primero
        if (cachedUserDataRef.current && Date.now() - cacheTimestampRef.current < CACHE_DURATION) {
          console.log('fetchSymptoms: Using cached user data');
         const specialty = cachedUserDataRef.current.specialty;
           
          const formattedBirthDate = format(new Date(selectedPatient.FechaNacimiento), 'yyyy/MM/dd');
          console.log('fetchSymptoms: Patient Birth Date (formatted):', formattedBirthDate);

          const { data, error } = await supabase.rpc('sintomasconsulta', { 
            p_fechanac: formattedBirthDate, 
            p_especialidad: specialty
          });    
          
          if (error) {
            throw error;
          }
          
          console.log('fetchSymptoms: Data from sintomasconsulta RPC:', data);
          setDynamicSymptoms(data?.sintomas || []);
          setIsLoadingSymptoms(false);
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setSymptomsError('Usuario no autenticado');
          setIsLoadingSymptoms(false);
          console.error('fetchSymptoms: No authenticated user session.');
          return;
        }

        const { data: userData, error: userError } = await supabase.rpc('get_user_idbu', {
          user_id: session.user.id
        });

        if (userError || !userData?.idbu) {
          setSymptomsError('No se pudo obtener la unidad de negocio del usuario');
          setIsLoadingSymptoms(false);
          console.error('fetchSymptoms: Error getting user business unit:', userError);
          return;
        }
        console.log('fetchSymptoms: User IDBU:', userData.idbu);

        const specialty = await api.businessUnits.getById(userData.idbu);
        if (!specialty) {
          setSymptomsError('No se pudo obtener la especialidad de la unidad de negocio');
          setIsLoadingSymptoms(false);
          console.error('fetchSymptoms: No specialty found for business unit:', userData.idbu);
          return;
        }
        console.log('fetchSymptoms: Business Unit Specialty:', specialty);

        // Guardar en cache
        cachedUserDataRef.current = { idbu: userData.idbu, specialty };
        cacheTimestampRef.current = Date.now();
        const formattedBirthDate = format(new Date(selectedPatient.FechaNacimiento), 'yyyy/MM/dd');
        console.log('fetchSymptoms: Patient Birth Date (formatted):', formattedBirthDate);

        const { data, error } = await supabase.rpc('sintomasconsulta', { 
          p_fechanac: formattedBirthDate, 
          p_especialidad: specialty
        });    
        
        if (error) {
          throw error;
        }
        
        console.log('fetchSymptoms: Data from sintomasconsulta RPC:', data);
        setDynamicSymptoms(data?.sintomas || []);
      } catch (error) {
        console.error('fetchSymptoms: Error fetching symptoms:', error);
        setSymptomsError('Error al cargar síntomas');
        setDynamicSymptoms([]);
      } finally {
        setIsLoadingSymptoms(false);
      }
    };

    fetchSymptoms();
  }, [selectedPatient]);

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

  if (!patientForForm)  {
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
    <div className="p-6">
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
                {isViewOnlyMode ? 'Ver Cita Médica' : editingAppointment ? 'Editar Cita Médica' : 'Agendar Consulta Médica'}
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
              {editingAppointment ? 'Cita actualizada exitosamente.' : 'Cita agendada exitosamente.'} Redirigiendo...
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Tipo de Consulta */}
              <div>
                <label 
                  className="block text-base font-medium mb-1"
                  style={{ color: currentTheme.colors.text }}
                >
                 Tipo de Consulta <span className="text-red-500">*</span>
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
                    Motivo Principal  <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...form.register('motivo')}
                    disabled={isViewOnlyMode} 
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
                      //disabled={isViewOnlyMode}
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
                      disabled={isViewOnlyMode}
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
                    {isLoadingSymptoms ? (
                      <p style={{ color: currentTheme.colors.textSecondary }}>Cargando síntomas...</p>
                    ) : symptomsError ? (
                      <p style={{ color: '#DC2626' }}>{symptomsError}</p>
                    ) : (
                      dynamicSymptoms.map(sintoma => {
                        const isSelected = form.watch('sintomas_asociados').includes(sintoma.sintoma); // CAMBIO: sintoma.sintoma
                        return (
                          <button
                            key={sintoma.sintoma} // CAMBIO: sintoma.sintoma
                            type="button"
                            //disabled={isViewOnlyMode}
                            onClick={() => {
                              const current = form.getValues('sintomas_asociados');
                              if (isSelected) {
                                form.setValue('sintomas_asociados', 
                                  current.filter(s => s !== sintoma.sintoma) // CAMBIO: sintoma.sintoma
                                );
                              } else {
                                form.setValue('sintomas_asociados', [...current, sintoma.sintoma]); // CAMBIO: sintoma.sintoma
                              }
                            }}
                            className={clsx(
                              'px-3 py-1 rounded-md text-sm transition-colors border',
                              isSelected && 'bg-slate-800 text-white border-slate-900',
                              !isSelected && 'bg-white hover:bg-slate-50 border-slate-200',
                              isViewOnlyMode && 'opacity-50 cursor-not-allowed'
                            )}
                            style={{
                              color: isSelected ? '#fff' : currentTheme.colors.text,
                            }}
                          >
                            {sintoma.sintoma} {/* CAMBIO: sintoma.sintoma */}
                          </button>
                        ); 
                      })
                    )}

                    {/* Mostrar síntomas personalizados agregados */}
                    {form.watch('sintomas_asociados')
                      ?.filter(
                        (id) =>
                         !dynamicSymptoms.some(sintoma => sintoma.sintoma === id) // CAMBIO: sintoma.sintoma
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
                            //disabled={isViewOnlyMode}
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
                      disabled={isViewOnlyMode}
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
                            const newTag = e.currentTarget.value.trim();
                            if (newTag && !form.getValues('sintomas_asociados')?.includes(newTag)) {
                              form.setValue('sintomas_asociados', [...(form.getValues('sintomas_asociados') || []), newTag]);
                              setCustomSymptom('');
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Fecha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...form.register('fecha_cita')}
                      //disabled={isViewOnlyMode}
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
                      Hora <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...form.register('hora_cita')}
                      disabled={loadingAvailableSlots || isViewOnlyMode || agendaLoading || !agendaSettings} // Deshabilitar si la agenda está cargando o no está configurada
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      {(loadingAvailableSlots || agendaLoading || !agendaSettings) ? ( // Mostrar mensaje de carga si la agenda está cargando
                        <option value="">Cargando horarios...</option>
                      ) : (
                        HORARIOS_CONSULTA.map(hora => {
                          const isAvailable = isTimeSlotAvailable(hora, form.watch('duracion_minutos') || 30);
                          const isCurrentSelection = form.watch('hora_cita') === hora;
                          
                          // Determinar si el horario está en el pasado (solo para el día actual)
                          const selectedDateStr = form.watch('fecha_cita');
                          const today = new Date();
                          const todayStr = format(today, 'yyyy-MM-dd');
                          const isPast = selectedDateStr === todayStr && new Date(`${selectedDateStr}T${hora}:00`) < today;

                          let label = hora;
                          let isDisabled = false;

                          if (!isAvailable && !isCurrentSelection) {
                            // Si no está disponible y NO es la selección actual, deshabilitar
                            isDisabled = true;
                            if (isPast) {
                              label += ' (Pasado)';
                            } else {
                              label += ' (Ocupado)';
                            }
                          } else if (!isAvailable && isCurrentSelection) {
                            // Si es la selección actual pero no está disponible, mostrar etiqueta pero no deshabilitar
                            if (isPast) {
                              label += ' (Pasado)';
                            } else {
                              label += ' (Ocupado)';
                            }
                            // No deshabilitar para que el valor inicial se mantenga seleccionado
                          }

                             console.log(`CitasPage: Hora: ${hora}, isAvailable: ${isAvailable}, isCurrentSelection: ${isCurrentSelection}, isDisabled: ${isDisabled}, isPast: ${isPast}, form.watch('hora_cita'): ${form.watch('hora_cita')}`);
                          
                          return (
                            <option
                              key={hora}
                              value={hora}
                              disabled={isDisabled}
                              style={{ 
                                color: isDisabled ? currentTheme.colors.textSecondary : currentTheme.colors.text 
                              }}
                            >
                              {label}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {form.formState.errors.hora_cita && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.hora_cita.message}
                      </p>
                    )}
                  </div>

 
                  {/* Nueva columna: Duración estimada */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Duración minutos <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...form.register('duracion_minutos', { valueAsNumber: true })}
                      //disabled={isViewOnlyMode}
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
                 <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Consultorio <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...form.register('consultorio', { valueAsNumber: true })}
                      //disabled={isViewOnlyMode}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      {activeConsultorios.map(consultorio => (
                        <option key={consultorio.id} value={consultorio.id}>
                          {consultorio.consultorio}
                        </option>
                      ))}
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
                      //disabled={isViewOnlyMode}
                      className="w-full p-2 rounded-md border bg-gray-100 cursor-not-allowed"
                      style={{
                        background: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    />
                  </div>

                  {/* Nueva columna: Estado de la cita */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <EstadoSelector
                      value={form.watch('estado')}
                      onChange={(estadoId) => form.setValue('estado', estadoId)}
                      disabled={isViewOnlyMode}
                    />
                  </div>

                  
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/agenda/agenda')}
                  className={clsx(buttonStyle.base, 'border')}
                  style={{
                    background: 'transparent',
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text,
                  }}
                >
                  {isViewOnlyMode ? 'Cerrar' : 'Cancelar'}
                </button>
                {!isViewOnlyMode && (
                  <button
                    type="submit"
                    disabled={loading}
                    className={clsx(buttonStyle.base, 'disabled:opacity-50')}
                    style={buttonStyle.primary}
                  >
                    {loading ? 'Guardando...' : editingAppointment ? 'Actualizar' : 'Agendar'}
                  </button>
                )}
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
          {selectedPatient?.Telefono ? selectedPatient.Telefono : 'No hay número de teléfono registrado.'}
        </p>
      </Modal>
    </div>
  );
}