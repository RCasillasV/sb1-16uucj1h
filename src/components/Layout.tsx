import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleBasedNavigation, NavigationItem } from './RoleBasedNavigation';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Sidebar } from './Sidebar'; // Re-añadir esta línea
import { MainHeader } from './MainHeader'; // Re-añadir esta línea
import { format, parseISO, isValid } from 'date-fns';
import packageJson from '../../package.json';
import clsx from 'clsx';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { user } = useAuth();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [clinicalHistoryCount, setClinicalHistoryCount] = useState<number | null>(null);
  const [clinicalEvolutionCount, setClinicalEvolutionCount] = useState<number | null>(null);
  const [prescriptionsCount, setPrescriptionsCount] = useState<number | null>(null);
  const [patientFilesCount, setPatientFilesCount] = useState<number | null>(null);
  const [lastAppointment, setLastAppointment] = useState<{
    date: Date;
    status: string;
  } | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Date | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showForm, setShowForm] = useState(false);
  const [userInfo, setUserInfo] = useState<{ 
    authId: string,
    nombre: string | null,
    idbu: string | null,
    business_name: string  | null,
    rol: string | null,
  }>({ 
    authId: '', 
    nombre: null,
    idbu: null,
    business_name: null,
    rol: null
  });

  useEffect(() => { 
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

    useEffect(() => {
    const fetchUserInfo = async () => {
      // Use user data from AuthContext for rol and nombre
      if (!user?.id) {
        setUserInfo({
          authId: '',
          nombre: null,
          idbu: null,
          business_name: null,
          rol: null
        });
        return;
      }

      try {
        // Get business unit information from get_user_idbu
        // La función RPC get_user_idbu() devuelve un objeto { idbu, business_name, role }
        const { data: userData, error: rpcError } = await supabase.rpc('get_user_idbu');

        if (rpcError) {
          console.error('Error fetching user business unit:', rpcError);
          setUserInfo({
            authId: user.id,
            nombre: user.nombre,
            idbu: user.idbu,
            business_unit: userData.business_name,
            rol: userData.role 
          });
          return;
        }

        setUserInfo({
          authId: user.id,
          nombre: user.nombre,
          idbu: userData?.idbu || user.idbu, // Usar el idbu del RPC si está disponible, sino el del contexto
          business_unit: userData?.business_name || null, // Mapear business_name a Nombre
          rol: userData?.role || userData.role // Usar el rol del RPC si está disponible, sino el del contexto
        });
      } catch (error) {
        console.error('Error in fetchUserInfo:', error);
        setUserInfo({
          authId: user?.id || '',
          nombre: user?.nombre || null,
          idbu: user?.idbu || null,
          business_name: userData?.business_name || null,
          rol: userData?.role || null
        });
      }
    };
    
    fetchUserInfo();
  }, [user]); // Depend on user from AuthContext

  useEffect(() => {
    if (selectedPatient) {
      setClinicalHistoryCount(null);
      setClinicalEvolutionCount(null);
      setPrescriptionsCount(null);
      setPatientFilesCount(null);
      fetchCounts();
      fetchAppointments();
    } else {
      setClinicalHistoryCount(0);
      setClinicalEvolutionCount(0);
      setPrescriptionsCount(0);
      setPatientFilesCount(0);
      setLastAppointment(null);
      setNextAppointment(null);
    }
  }, [selectedPatient]);

  const fetchCounts = useCallback(async () => {
    if (!selectedPatient) return;
    
    console.log('Layout.fetchCounts: Starting count fetch for patient:', selectedPatient.id);
    
    try {
      const [
        clinicalHistoryRpcResult,
        evolutions,
        prescriptions,
        files
      ] = await Promise.all([
        supabase.rpc('cuenta_fichaclinica', { p_patient_id: selectedPatient.id }),
        api.clinicalEvolution.getByPatientId(selectedPatient.id),
        api.prescriptions.getByPatientId(selectedPatient.id),
        api.files.getByPatientId(selectedPatient.id)
      ]);
      
      // Handle RPC result - check for errors first
      if (clinicalHistoryRpcResult.error) {
        console.error('Error calling cuenta_fichaclinica RPC:', clinicalHistoryRpcResult.error);
        setClinicalHistoryCount(null); // Set to null on error to hide badge
      } else {
        // The RPC function returns the total count directly
        const totalClinicalHistoryCount = clinicalHistoryRpcResult.data || 0;
        console.log('Layout.fetchCounts: Clinical history count received:', totalClinicalHistoryCount);
        setClinicalHistoryCount(totalClinicalHistoryCount);
      }
      
      console.log('Layout.fetchCounts: All counts updated - Evolution:', evolutions.length, 'Prescriptions:', prescriptions.length, 'Files:', files.length);
      setClinicalEvolutionCount(evolutions.length);
      setPrescriptionsCount(prescriptions.length);
      setPatientFilesCount(files.length);
    } catch (error) {
      console.error('Error fetching counts:', error);
      // Set fallback values on error
      setClinicalHistoryCount(null);
      setClinicalEvolutionCount(0);
      setPrescriptionsCount(0);
      setPatientFilesCount(0);
    }
  }, [selectedPatient]);

  const fetchAppointments = useCallback(async () => {
    if (!selectedPatient) return;

    console.log('Layout: fetchAppointments - Fetching appointments for patient:', selectedPatient.id);

    try {
      // Fetch appointments specifically for the selected patient
      const patientAppointments = await api.appointments.getByPatientId(selectedPatient.id);
      console.log('Layout: fetchAppointments - Raw patient appointments:', patientAppointments);

      // Sort appointments by date and time in ascending order
      const sortedAppointments = [...patientAppointments].sort((a, b) => {
        const dateTimeA = parseISO(`${a.fecha_cita}T${a.hora_cita}`);
        const dateTimeB = parseISO(`${b.fecha_cita}T${b.hora_cita}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });
      console.log('Layout: fetchAppointments - Sorted appointments:', sortedAppointments);

      const now = new Date();
      console.log('Layout: fetchAppointments - Current time (now):', now.toISOString());

      // Definir los estados que se consideran "próximos" o "activos"
      const UPCOMING_ACTIVE_STATUSES = [
        'Programada',
        'Confirmada', 
        'Reprogramada x Paciente',
        'Reprogramada x Médico',
        'En Espera',
        'Urgencia'
      ];

      let last: { date: Date; status: string } | null = null;
      let next: Date | null = null;

      // Find the last appointment (past or current)
      for (let i = sortedAppointments.length - 1; i >= 0; i--) {
        const app = sortedAppointments[i];
        const appDateTime = parseISO(`${app.fecha_cita}T${app.hora_cita}`);
        if (!isValid(appDateTime)) {
          console.warn(`Layout: Invalid date/time for appointment ID ${app.id}: ${app.fecha_cita}T${app.hora_cita}`);
          continue;
        }
        if (appDateTime <= now) {
          last = {
            date: appDateTime,
            status: app.estado === 'Atendida' ? 'COMPLETA' : 'PROGRAMADA'
          };
          console.log('Layout: fetchAppointments - Found last appointment:', last);
          break;
        }
      }

      // Find the next upcoming scheduled appointment
      for (const app of sortedAppointments) {
        const appDateTime = parseISO(`${app.fecha_cita}T${app.hora_cita}`);
        if (!isValid(appDateTime)) {
          console.warn(`Layout: Invalid date/time for appointment ID ${app.id}: ${app.fecha_cita}T${app.hora_cita}`);
          continue;
        }
        console.log(`Layout: Checking appointment ID ${app.id}: appDateTime=${appDateTime.toISOString()}, now=${now.toISOString()}, app.estado=${app.estado}`);
        if (appDateTime > now && UPCOMING_ACTIVE_STATUSES.includes(app.estado)) {
          next = appDateTime;
          console.log('Layout: fetchAppointments - Found next appointment:', next);
          break;
        }
      }

      setLastAppointment(last);
      setNextAppointment(next);
      console.log('Layout: fetchAppointments - Final lastAppointment:', last);
      console.log('Layout: fetchAppointments - Final nextAppointment:', next);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  }, [selectedPatient]);

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleContextMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  }, [showContextMenu]);

  const handleEditPatient = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    if (selectedPatient) {
      setShowForm(true);
      navigate('/patients', { state: { editMode: true, patientId: selectedPatient.id } });
    }
  }, [selectedPatient, navigate]);

  const handleDeselectPatient = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    setSelectedPatient(null);
  }, [setSelectedPatient]);

  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem('userToken'); 
      localStorage.removeItem('userData');
      sessionStorage.clear();
      const { error } = await signOut();
      if (error) {
        console.error('Error during logout:', error);
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      navigate('/login');
    }
  }, [signOut]);

  return (
    <div className="min-h-screen flex" style={{
      background: currentTheme.colors.background,
      color: currentTheme.colors.text,
    }}>
      <Sidebar 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        userRole={user?.userRole}
        packageVersion={packageJson.version}
        handleLogout={handleLogout}
        isMobile={isMobile}
        clinicalEvolutionCount={clinicalEvolutionCount}
      />

      <div 
        className="flex-1 flex flex-col transition-all duration-100"
        style={{ marginLeft: isExpanded ? '10rem' : '2rem' }}
      >
        <MainHeader
          selectedPatient={selectedPatient}
          userInfo={userInfo}
          clinicalHistoryCount={clinicalHistoryCount}
          clinicalEvolutionCount={clinicalEvolutionCount}
          prescriptionsCount={prescriptionsCount}
          patientFilesCount={patientFilesCount}
          lastAppointment={lastAppointment}
          nextAppointment={nextAppointment}
          showContextMenu={showContextMenu}
          handleContextMenuClick={handleContextMenuClick}
          handleDeselectPatient={handleDeselectPatient}
          handleEditPatient={handleEditPatient}
        />

        <main className="flex-1 overflow-auto">
          <div className="pl-2 pr-2 pb-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
