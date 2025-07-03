import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleBasedNavigation, NavigationItem } from './RoleBasedNavigation';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns'; // Import parseISO
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
  const [clinicalHistoryCount, setClinicalHistoryCount] = useState(0);
  const [clinicalEvolutionCount, setClinicalEvolutionCount] = useState(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [patientFilesCount, setPatientFilesCount] = useState(0);
  const [lastAppointment, setLastAppointment] = useState<{
    date: Date;
    status: string;
  } | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Date | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showForm, setShowForm] = useState(false);
  const [userInfo, setUserInfo] = useState<{ 
    authId: string; 
    idbu: string | null;
    business_unit: { Nombre: string } | null 
  }>({ 
    authId: '', 
    idbu: null,
    business_unit: null
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUserInfo({
            authId: '',
            idbu: null,
            business_unit: null
          });
          return;
        }
        
        const { data: userData, error: rpcError } = await supabase.rpc('get_user_idbu', {
          user_id: session.user.id
        });

        // Check for errors from the RPC call
        if (rpcError) {
          console.error('Error fetching user data:', rpcError);          
          setUserInfo({
            authId: session.user.id,
            idbu: null,
            business_unit: null
          });
          return;
        }

        setUserInfo({
          authId: session.user.id,
          idbu: userData?.idbu || null,
          business_unit: userData?.business_unit || null
        });
      } catch (error) {
        console.error('Error in fetchUserInfo:', error);
        setUserInfo({
          authId: '',
          idbu: null,
          business_unit: null
        });
      }
    };
    
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
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
    try {
      const [histories, evolutions, prescriptions, files] = await Promise.all([
        api.clinicalHistories.getByPatientId(selectedPatient.id),
        api.clinicalEvolution.getByPatientId(selectedPatient.id),
        api.prescriptions.getByPatientId(selectedPatient.id),
        api.files.getByPatientId(selectedPatient.id)
      ]);
      
      setClinicalHistoryCount(histories.length);
      setClinicalEvolutionCount(evolutions.length);
      setPrescriptionsCount(prescriptions.length);
      setPatientFilesCount(files.length);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, [selectedPatient]);

  const fetchAppointments = useCallback(async () => {
    if (!selectedPatient) return;

    try {
      // Fetch appointments specifically for the selected patient
      const patientAppointments = await api.appointments.getByPatientId(selectedPatient.id);

      // Sort appointments by date and time in ascending order
      const sortedAppointments = [...patientAppointments].sort((a, b) => {
        const dateTimeA = parseISO(`${a.fecha_cita}T${a.hora_cita}`);
        const dateTimeB = parseISO(`${b.fecha_cita}T${b.hora_cita}`);
        return dateTimeA.getTime() - dateTimeB.getTime();
      });

      const now = new Date();
      let last: { date: Date; status: string } | null = null;
      let next: Date | null = null;

      // Find the last appointment (past or current)
      for (let i = sortedAppointments.length - 1; i >= 0; i--) {
        const app = sortedAppointments[i];
        const appDateTime = parseISO(`${app.fecha_cita}T${app.hora_cita}`);
        if (appDateTime <= now) {
          last = {
            date: appDateTime,
            status: app.estado === 'completada' ? 'COMPLETA' : 'PROGRAMADA' // Use 'PROGRAMADA' for past but not completed
          };
          break;
        }
      }

      // Find the next upcoming scheduled appointment
      for (const app of sortedAppointments) {
        const appDateTime = parseISO(`${app.fecha_cita}T${app.hora_cita}`);
        if (appDateTime > now && app.estado === 'programada') {
          next = appDateTime;
          break;
        }
      }

      setLastAppointment(last);
      setNextAppointment(next);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  }, [selectedPatient]);

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
      fontFamily: currentTheme.typography.fontFamily,
    }}>
      <Sidebar 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        userRole={user?.userRole}
        packageVersion={packageJson.version}
        handleLogout={handleLogout}
        isMobile={isMobile}
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
