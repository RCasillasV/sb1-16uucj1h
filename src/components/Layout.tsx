import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, LayoutDashboard, FileText, Activity, Syringe, Image, FileSpreadsheet, FolderOpen, Stethoscope, Settings as SettingsIcon, Mail, Phone, Cake, Baby, Mars, Venus, Clock, MoreVertical, LogOut, UserSquare as RulerSquare, NotebookTabs } from 'lucide-react';
import { RoleBasedNavigation, NavigationItem } from './RoleBasedNavigation';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { calculateAge } from '../utils/dateUtils';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import packageJson from '../../package.json';

const baseNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Pacientes', href: '/patients', icon: Users, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Citas', href: '/citas', icon: Clock, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Agenda', href: '/agenda/agenda', icon: Calendar, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Historia Clínica', href: '/clinical-history', icon: FileText, roles: ['Administrador', 'Medico'] },
  { name: 'Evolución Clínica', href: '/clinical-evolution', icon: Activity, roles: ['Administrador', 'Medico'] },
  { name: 'Recetas', href: '/prescriptions', icon: FileSpreadsheet, roles: ['Administrador', 'Medico'] },
  { name: 'Somatometría', href: '/somatometry', icon: RulerSquare, roles: ['Administrador', 'Medico'] },
  { name: 'Archivos', href: '/patient-files', icon: FolderOpen, roles: ['Administrador', 'Medico'] },
  { name: 'Catálogos', href: '/cie10', icon: NotebookTabs, roles: ['Administrador', 'Medico'] },

  /*  Deshabilitadas por el momento 
   { name: 'Citas2', href: '/citas', icon: Clock },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
  */
] as const;

const bottomNavigation: NavigationItem[] = [
  { name: 'Unidades de Negocio', href: '/clinica', icon: Stethoscope, roles: ['Administrador'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['Administrador'] },
  { name: 'Configuración', href: '/settings', icon: SettingsIcon, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Cerrar Sesión', href: '/login', icon: LogOut, roles: ['Administrador', 'Medico', 'Recepcionista'] },
] as const;

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


  const isMenuItemActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

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

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      const patientAppointments = await api.appointments.getByPatientId(selectedPatient.id);

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
  }, [selectedPatient]);

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

  const navigation = useMemo(() => {
    // Filter navigation items based on user role
    const filteredBaseNavigation = RoleBasedNavigation({
      navigationItems: baseNavigation,
      userRole: user?.userRole
    });
    
    // Filter bottom navigation items based on user role
    const filteredBottomNavigation = RoleBasedNavigation({
      navigationItems: bottomNavigation.map(item => 
        item.name === 'Cerrar Sesión' 
          ? { ...item, onClick: handleLogout }
          : item
      ),
      userRole: user?.userRole
    });
    
    return [
      ...filteredBaseNavigation,
      { type: 'divider' as const },
      ...filteredBottomNavigation
    ];
  }, [handleLogout, user?.userRole]);

  const getInitials = (patient: typeof selectedPatient) => {
    if (!patient) return '';
    return `${patient.Nombre.charAt(0)}${patient.Paterno.charAt(0)}`.toUpperCase();
  };

  const formatPatientInfo = () => {
    if (!selectedPatient) return null;

    const age = selectedPatient.FechaNacimiento ? calculateAge(selectedPatient.FechaNacimiento) : null;
    const birthDate = selectedPatient.FechaNacimiento ? (() => {
      const date = parseISO(selectedPatient.FechaNacimiento);
      return isValid(date) ? format(date, "dd 'de' MMM 'del' yy", { locale: es }) : null;
    })() : null;

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

    const GenderIcon = selectedPatient?.Sexo?.toLowerCase() === 'femenino' ? Venus : Mars;

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

          <div className="flex flex-col gap-1">
            <h2 
              className="text-xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              {selectedPatient.Nombre} {selectedPatient.Paterno || ''} {selectedPatient.Materno || ''}
            </h2>
            <div className="flex items-center flex-wrap text-sm gap-2">
              {age && (
                <>
                  <InfoItem icon={Baby} text={age.formatted} />
                  <Separator />
                </>
              )}
              {birthDate && (
                <>
                  <InfoItem icon={Cake} text={birthDate} />
                  <Separator />
                </>
              )}
              {selectedPatient.Sexo && (
                <>
                  <InfoItem icon={GenderIcon} text={selectedPatient.Sexo} />
                </>
              )}
              {selectedPatient.Telefono && (
                <>
                  <Separator />
                  <InfoItem icon={Phone} text={selectedPatient.Telefono} />
                </>
              )}
              {selectedPatient.Email && (
                <>
                  <Separator />
                  <InfoItem icon={Mail} text={selectedPatient.Email} />
                </>
              )}
              {(
                <> 
                  <Separator />
                  <InfoItem 
                    icon={Clock} 
                    text={`Última: ${lastAppointment ? format(lastAppointment.date, "d 'de' MMM", { locale: es }) : 'Sin citas previas'}`}
                  />
                </>
              )}
              { (
                <>
                  <Separator />
                  <InfoItem 
                    icon={Calendar} 
                    text={`Próxima: ${nextAppointment ? format(nextAppointment, "d 'de' MMM", { locale: es }) : 'Sin citas programadas'}`}
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
              <button
                onClick={handleEditPatient}
                className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors"
                style={{ color: currentTheme.colors.text }}
              >
                Editar
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
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-500 ease-in-out',
          isExpanded ? 'w-40' : 'w-10'
        )}
        style={{ background: currentTheme.colors.sidebar }}
        onMouseEnter={() => !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isMobile && setIsExpanded(false)}
      >
        <div className="h-16 flex items-center px-3">
          <Link to="/" className="flex items-center gap-2" style={{ color: currentTheme.colors.sidebarText }}>
            <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ background: currentTheme.colors.primary }}>
              <Stethoscope className="w-5 h-5" style={{ color: currentTheme.colors.sidebarText }} />
            </div>
            <span className={clsx(
              "text-base font-bold transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}>
              DoctorSoft+
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 mt-4 overflow-hidden">
          {navigation.map((item: any, index) => {
            if ('type' in item && item.type === 'divider') {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-2 mx-3 border-t"
                  style={{ borderColor: currentTheme.colors.sidebarHover }}
                />
              );
            }

            const Icon = 'icon' in item ? item.icon : null;
            const isActive = 'href' in item && location.pathname === item.href;
            
            return (
              <div className="relative group">
                <Link
                key={'name' in item ? item.name : `divider-${index}`}
                to={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={clsx(
                  'flex items-center py-2.5 px-3 text-sm transition-all duration-300 relative',
                  isMenuItemActive(item.href) && 'bg-opacity-10'
                )}
                style={{
                  color: currentTheme.colors.sidebarText,
                  background: isMenuItemActive(item.href) ? currentTheme.colors.sidebarHover : 'transparent',
                }}
              >
                <Icon 
                  className="h-5 w-5 shrink-0" 
                  style={{ 
                    color: isMenuItemActive(item.href) 
                      ? currentTheme.colors.sidebarText 
                      : currentTheme.colors.sidebarText 
                  }}
                />
                <span className={clsx(
                  "ml-3 whitespace-nowrap transition-all duration-300", 
                  isMenuItemActive(item.href) && "font-bold",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}>
                  {item.name}
                </span>
                {'count' in item && item.count > 0 && (
                  <span 
                    className={clsx(
                      'absolute text-xs rounded-full w-5 h-5 flex items-center justify-center transition-all duration-300',
                      isExpanded ? 'right-3' : 'right-1'
                    )}
                    style={{
                      background: currentTheme.colors.primary,
                      color: currentTheme.colors.sidebarText
                    }}
                  >
                    {item.count}
                  </span>
                )}
               </Link>
               
               {/* Tooltip */}
               {!isExpanded && (
                 <div 
                   className="absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                   style={{
                     background: currentTheme.colors.surface,
                     color: currentTheme.colors.text,
                     border: `1px solid ${currentTheme.colors.border}`,
                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                     top: '50%',
                     transform: 'translateY(-50%)'
                   }}
                 >
                   {item.name}
                 </div>
               )}
             </div>
            );
          })}
        </nav>

        <div 
          className="px-3 py-2 text-xs border-t"
          style={{ 
            borderColor: currentTheme.colors.sidebarHover,
            color: currentTheme.colors.sidebarText 
          }}
        >
          <span className={clsx(
            "transition-all duration-300",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            Versión {packageJson.version}
          </span>
        </div>
      </div>

      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: isExpanded ? '10rem' : '2rem' }}
      >
        <div 
          className="sticky top-0 z-20 border-b"
          style={{
            background: currentTheme.colors.header,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.headerText,
          }}
        >
          <div className="h-auto min-h-16 flex items-center px-6 py-3">
            {selectedPatient ? formatPatientInfo() : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium\" style={{ color: currentTheme.colors.textSecondary }}>
                    ID de Usuario:
                  </span>
                  <span className="font-mono" style={{ color: currentTheme.colors.text }}>
                    {userInfo.authId || 'No identificado'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                    Unidad de Negocio:
                  </span>
                  <span className="font-medium" style={{ color: currentTheme.colors.text }}>
                    {userInfo?.idbu || 'No asignada'}
                  </span>
                </div>
              </div>
            )}
          </div>
          {selectedPatient && (
            <div 
              className="flex items-center gap-2 px-6 py-2 border-t overflow-x-auto relative"
              style={{ borderColor: currentTheme.colors.border }}
            >
              <Link
                to="/clinical-history"
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-black/5 transition-colors relative"
              >
                <FileText className="h-4 w-4" />
                <span className="relative">
                  Historia Clínica
                  {clinicalHistoryCount > 0 && (
                    <span 
                      className="absolute -top-2 -right-3 text-[0.65rem] font-bold"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      {clinicalHistoryCount}
                    </span>
                  )}
                </span>
              </Link>
              <Link
                to="/clinical-evolution"
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-black/5 transition-colors"
              >
                <Activity className="h-4 w-4" />
                Evolución Clínica
                {clinicalEvolutionCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center font-bold rounded-full"
                    style={{
                      background: currentTheme.colors.primary,
                      color: currentTheme.colors.buttonText
                    }}
                  >
                    {clinicalEvolutionCount}
                  </span>
                )}
              </Link>
              <Link
                to="/prescriptions"
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-black/5 transition-colors"
                style={{ position: 'relative' }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Recetas
                {prescriptionsCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full"
                    style={{
                      background: currentTheme.colors.primary,
                      color: currentTheme.colors.buttonText
                    }}
                  >
                    {prescriptionsCount}
                  </span>
                )}
              </Link>
              <Link
                to="/patient-files"
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-black/5 transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="relative">
                  Archivos del Paciente
                  {patientFilesCount > 0 && (
                    <span 
                      className="absolute -top-2 -right-3 text-[0.65rem] font-bold"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      {patientFilesCount}
                    </span>
                  )}
                </span>
              </Link>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-auto">
          <div className="pl-6 pr-2 pb-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/*export { Layout }*/