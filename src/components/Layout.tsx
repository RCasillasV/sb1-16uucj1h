import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, LayoutDashboard, FileText, Activity, Syringe, Image, FileSpreadsheet, Ruler, Stethoscope, Settings as SettingsIcon, Mail, Phone, Cake, Baby, Mars, Venus, Clock, MoreVertical, LogOut } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { calculateAge } from '../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [clinicalHistoryCount, setClinicalHistoryCount] = useState(0);
  const [clinicalEvolutionCount, setClinicalEvolutionCount] = useState(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [lastAppointment, setLastAppointment] = useState<{
    date: Date;
    status: string;
  } | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Date | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchCounts();
      fetchAppointments();
    } else {
      setClinicalHistoryCount(0);
      setClinicalEvolutionCount(0);
      setPrescriptionsCount(0);
      setLastAppointment(null);
      setNextAppointment(null);
    }
  }, [selectedPatient]);

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchCounts = async () => {
    if (!selectedPatient) return;
    try {
      const [histories, evolutions, prescriptions] = await Promise.all([
        api.clinicalHistories.getByPatientId(selectedPatient.id),
        api.clinicalEvolution.getByPatientId(selectedPatient.id),
        api.prescriptions.getByPatientId(selectedPatient.id)
      ]);
      
      setClinicalHistoryCount(histories.length);
      setClinicalEvolutionCount(evolutions.length);
      setPrescriptionsCount(prescriptions.length);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!selectedPatient) return;

    try {
      const appointments = await api.appointments.getAll();
      const patientAppointments = appointments
        .filter(app => app.patient_id === selectedPatient.id)
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

      const last = patientAppointments.find(app => 
        new Date(app.appointment_date) <= new Date()
      );
      if (last) {
        setLastAppointment({
          date: new Date(last.appointment_date),
          status: last.status === 'completed' ? 'COMPLETA' : ''
        });
      }

      const next = patientAppointments.find(app => 
        new Date(app.appointment_date) > new Date() && app.status === 'scheduled'
      );
      if (next) {
        setNextAppointment(new Date(next.appointment_date));
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  };

  const handleEditPatient = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    navigate('/patients');
  };

  const handleDeselectPatient = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    setSelectedPatient(null);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Agenda2', href: '/agenda2', icon: Calendar },
    { name: 'Pacientes', href: '/patients', icon: Users },
    { name: 'Citas', href: '/appointments', icon: Clock },
    { name: 'Agenda', href: '/calendar', icon: Calendar },
  ];

  const medicalNavigation = selectedPatient ? [
    { 
      name: 'Historia Clínica', 
      href: '/clinical-history', 
      icon: FileText,
      count: clinicalHistoryCount 
    },
    { 
      name: 'Evolución Clínica', 
      href: '/clinical-evolution', 
      icon: Activity,
      count: clinicalEvolutionCount 
    },
    { 
      name: 'Recetas', 
      href: '/prescriptions', 
      icon: FileSpreadsheet,
      count: prescriptionsCount 
    },
    { name: 'Vacunación', href: '/vaccination', icon: Syringe },
    { name: 'Imágenes', href: '/images', icon: Image },
    { name: 'Somatometrías', href: '/somatometry', icon: Ruler },
  ] : [];

  const bottomNavigation = [
    { name: 'Configuración', href: '/settings', icon: SettingsIcon },
    { name: 'Cerrar Sesión', href: '/login', icon: LogOut, onClick: handleLogout },
  ];

  const navigation = [
    ...baseNavigation,
    ...(selectedPatient ? [{ type: 'divider' }] : []),
    ...medicalNavigation,
    { type: 'divider' },
    ...bottomNavigation
  ];

  const getInitials = (patient: typeof selectedPatient) => {
    if (!patient) return '';
    return `${patient.first_name.charAt(0)}${patient.paternal_surname.charAt(0)}`.toUpperCase();
  };

  const formatPatientInfo = () => {
    if (!selectedPatient) return null;

    const age = calculateAge(selectedPatient.date_of_birth);
    const birthDate = format(new Date(selectedPatient.date_of_birth), 'dd/mm/yyyy');

    const InfoItem = ({ icon: Icon, text, status }: { icon: typeof Mail; text: string; status?: string }) => (
      <div className="flex items-center gap-1">
        <Icon className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
        <span style={{ color: currentTheme.colors.textSecondary }}>
          {text}
          {status && (
            <span className={clsx(
              'ml-1 font-medium',
              status === 'COMPLETA' ? 'text-green-600' : 'text-blue-600'
            )}>
              ({status})
            </span>
          )}
        </span>
      </div>
    );

    const Separator = () => (
      <div 
        className="h-4 w-px mx-2" 
        style={{ background: currentTheme.colors.border }}
      />
    );

    const GenderIcon = selectedPatient.gender.toLowerCase() === 'femenino' ? Venus : Mars;

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold transition-colors"
            style={{ 
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
            }}
          >
            {getInitials(selectedPatient)}
          </div>

          <div className="flex flex-col gap-2">
            <h2 
              className="text-xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              {selectedPatient.first_name} {selectedPatient.paternal_surname} {selectedPatient.last_name}
            </h2>
            <div className="flex items-center flex-wrap text-sm gap-2">
              <InfoItem icon={Baby} text={age.formatted} />
              <Separator />
              <InfoItem icon={Cake} text={birthDate} />
              <Separator />
              <InfoItem icon={GenderIcon} text={selectedPatient.gender} />
              {selectedPatient.phone && (
                <>
                  <Separator />
                  <InfoItem icon={Phone} text={selectedPatient.phone} />
                </>
              )}
              {selectedPatient.email && (
                <>
                  <Separator />
                  <InfoItem icon={Mail} text={selectedPatient.email} />
                </>
              )}
              {lastAppointment && (
                <>
                  <Separator />
                  <InfoItem 
                    icon={Clock} 
                    text={`Última: ${format(lastAppointment.date, 'dd MMM yy')}`}
                    status={lastAppointment.status}
                  />
                </>
              )}
              {nextAppointment && (
                <>
                  <Separator />
                  <InfoItem 
                    icon={Calendar} 
                    text={`Próxima: ${format(nextAppointment, 'dd MMM yy')}`}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={handleContextMenuClick}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <MoreVertical 
              className="h-5 w-5" 
              style={{ color: currentTheme.colors.textSecondary }}
            />
          </button>

          {showContextMenu && (
            <div 
              className="absolute right-0 mt-1 py-1 w-32 rounded-md shadow-lg z-10"
              style={{ 
                background: currentTheme.colors.surface,
                border: `1px solid ${currentTheme.colors.border}`,
              }}
            >
              <button
                onClick={handleDeselectPatient}
                className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors"
                style={{ color: currentTheme.colors.text }}
              >
                Deseleccionar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex" style={{
      background: currentTheme.colors.background,
      color: currentTheme.colors.text,
      fontFamily: currentTheme.typography.fontFamily,
    }}>
      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 transition-all duration-300 ease-in-out z-30',
          isExpanded ? 'w-64' : 'w-16'
        )}
        style={{ background: currentTheme.colors.sidebar }}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4">
          <Link to="/" className="flex items-center gap-3" style={{ color: currentTheme.colors.sidebarText }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background: currentTheme.colors.primary }}>
              <Stethoscope className="w-5 h-5" style={{ color: currentTheme.colors.sidebarText }} />
            </div>
            <span className={clsx(
              "font-bold transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0 w-0"
            )}>
              DoctorSoft+
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          {navigation.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={`divider-${index}`}
                  className={clsx(
                    'my-2 border-t',
                    isExpanded ? 'mx-4' : 'mx-2'
                  )}
                  style={{ borderColor: currentTheme.colors.sidebarHover }}
                />
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={clsx(
                  'flex items-center py-3 text-sm transition-all duration-300 relative',
                  isExpanded ? 'px-6' : 'px-4 justify-center'
                )}
                style={{
                  color: currentTheme.colors.sidebarText,
                  background: isActive ? currentTheme.colors.sidebarHover : 'transparent',
                }}
              >
                <Icon className={clsx(
                  'h-5 w-5 shrink-0',
                  isExpanded ? 'mr-3' : 'mr-0'
                )} />
                <span className={clsx(
                  'transition-all duration-300 whitespace-nowrap',
                  isExpanded ? 'opacity-100' : 'opacity-0 w-0'
                )}>
                  {item.name}
                </span>
                {'count' in item && item.count > 0 && (
                  <span className={clsx(
                    'absolute text-xs rounded-full w-5 h-5 flex items-center justify-center',
                    isExpanded ? 'right-4' : '-right-1 -top-1'
                  )}
                  style={{
                    background: currentTheme.colors.primary,
                    color: currentTheme.colors.sidebarText
                  }}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className={clsx(
        'flex-1 flex flex-col transition-all duration-300',
        isExpanded ? 'ml-64' : 'ml-16'
      )}>
        {/* Header */}
        <div 
          className="sticky top-0 z-20 border-b"
          style={{
            background: currentTheme.colors.header,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.headerText,
          }}
        >
          <div className="h-auto min-h-16 flex items-center px-6 py-3">
            {selectedPatient && formatPatientInfo()}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}