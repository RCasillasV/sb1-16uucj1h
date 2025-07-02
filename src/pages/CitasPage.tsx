import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, Info, HelpCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

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
  const [dynamicSymptoms, setDynamicSymptoms] = useState<string[]>([]);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);
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

  // Fetch symptoms based on patient age
  useEffect(() => {
    if (!selectedPatient || !selectedPatient.FechaNacimiento) return;
    
    const fetchSymptoms = async () => {
      setIsLoadingSymptoms(true);
      setSymptomsError(null);
      
      try {
        // Calculate age in months
        const birthDate = new Date(selectedPatient.FechaNacimiento);
        const ageInMonths = differenceInMonths(new Date(), birthDate);
        
        // Call the RPC function
        const { data, error } = await supabase.rpc('sintomasconsulta', {
          edad_meses: ageInMonths
        });
        
        if (error) throw error;
        
        // Update state with the fetched symptoms
        setDynamicSymptoms(data || []);
      } catch (error) {
        console.error('Error fetching symptoms:', error);
        setSymptomsError('No se pudieron cargar los síntomas');
        // Fallback to empty array
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
          style={buttonStyle.