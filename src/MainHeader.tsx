import React from 'react';  
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Cake, Baby, Mars, Venus, Clock, MoreVertical, Calendar, FileText, Activity, FileSpreadsheet, FolderOpen, User, Printer, ChevronDown, ChevronUp, Heart, Smile as Family, Stethoscope, Scale, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { Modal } from './Modal';
import { PatientReport } from './Informes/PatientReport';
import { ComprehensiveClinicalHistoryReport } from './Informes/ComprehensiveClinicalHistoryReport';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateAge } from '../utils/dateUtils';
import clsx from 'clsx';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

const HORIZONTAL_OFFSET = 12; // Pixels to shift the popover to the right

interface MainHeaderProps {
  selectedPatient: Patient | null;
  userInfo: { 
    authId: string; 
    nombre: string | null;
    idbu: string | null;
    business_name: string  | null;
    rol: string | null;
  };
  clinicalHistoryCount: number;
  clinicalEvolutionCount: number;
  prescriptionsCount: number;
  patientFilesCount: number;
  somatometryCount: number; 
  
  lastAppointment: {
    date: Date;
    status: string;
  } | null;
  nextAppointment: Date | null;
  showContextMenu: boolean;
  handleContextMenuClick: (e: React.MouseEvent) => void;
  handleDeselectPatient: (e: React.MouseEvent) => void;
  handleEditPatient: (e: React.MouseEvent) => void;
}

export function MainHeader({
  selectedPatient,
  userInfo,
  clinicalHistoryCount,
  clinicalEvolutionCount,
  prescriptionsCount,
  patientFilesCount,
  somatometryCount,
  lastAppointment,
  nextAppointment,
  showContextMenu,
  handleContextMenuClick,
  handleDeselectPatient,
  handleEditPatient
}: MainHeaderProps) {
  const { currentTheme } = useTheme();
  const [showComprehensiveReportModal, setShowComprehensiveReportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClinicalHistorySubmenu, setShowClinicalHistorySubmenu] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const clinicalHistoryButtonRef = useRef<HTMLButtonElement>(null);
  const clinicalHistoryPopoverRef = useRef<HTMLDivElement>(null);

  // Calculate popover position when it should be shown
  useEffect(() => {
    if (showClinicalHistorySubmenu && clinicalHistoryButtonRef.current) {
      const calculatePosition = () => {
        if (!clinicalHistoryButtonRef.current) {
          return; // Exit early if ref is null
        }
        
        if (!clinicalHistoryButtonRef.current) {
          return; // Exit if ref is null
        }
        const buttonRect = clinicalHistoryButtonRef.current!.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Position below the button, centered horizontally
        const top = buttonRect.bottom + scrollY + 8; // 8px gap
        const left = buttonRect.left + scrollX + (buttonRect.width / 2) - (384 / 2) + HORIZONTAL_OFFSET; // 384px is w-96
        
        // Ensure popover doesn't go off-screen
        const adjustedLeft = Math.max(16, Math.min(left, window.innerWidth - 384 - 16));
        
        setPopoverPosition({ top, left: adjustedLeft });
      };

      calculatePosition();

      // Recalculate on resize or scroll
      const handleReposition = () => calculatePosition();
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition);

      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition);
      };
    } else {
      setPopoverPosition(null);
    }
  }, [showClinicalHistorySubmenu]);

  // Handle click outside to close the popover
  useEffect(() => {
    if (!showClinicalHistorySubmenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both the button and the popover
      if (
        clinicalHistoryButtonRef.current && 
        !clinicalHistoryButtonRef.current.contains(target) &&
        clinicalHistoryPopoverRef.current &&
        !clinicalHistoryPopoverRef.current.contains(target)
      ) {
        setShowClinicalHistorySubmenu(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClinicalHistorySubmenu]);

  const handleShowReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Abrir informe en modal
    setShowReportModal(true);

    // Cerrar el menú contextual si está abierto
    if (showContextMenu) {
      handleContextMenuClick(e);
    }
  };

  const handleCloseReport = () => {
    setShowReportModal(false);
  };

  const getInitials = (patient: typeof selectedPatient) => {
    if (!patient) return '';
    return `${(patient.Nombre ?? '').charAt(0)}${(patient.Paterno ?? '').charAt(0)}`.toUpperCase();
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
        <Icon className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
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
              {selectedPatient.Refiere && (
                <>
                  <Separator />
                  <InfoItem
                    icon={User}
                    text={`Refiere: ${selectedPatient.Refiere}`}
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
              
              <button
                onClick={handleShowReport}
                className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors flex items-center gap-2"
                style={{ color: currentTheme.colors.text }}
              >
                <Printer className="h-6 w-6" />
                Ficha de datos
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComprehensiveReportModal(true);
                  handleContextMenuClick(e);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-black/5 transition-colors flex items-center gap-2"
                style={{ color: currentTheme.colors.text }}
              >
                <FileText className="h-8 w-8" />
                Informe Clínico Integral
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPatientNavigation = () => {
    if (!selectedPatient) return null;

    // Verificar el rol del usuario
    const userRole = userInfo.rol;
    const allowedRoles = ['Medico', 'Administrador'];
    
    // Si el usuario no tiene un rol permitido, no renderizar la navegación
    if (!userRole || !allowedRoles.includes(userRole)) {
      return null;
    }
    
    // Obtener la ruta actual
    const currentPath = window.location.pathname;
    
    // Función para verificar si una ruta está activa
    const isActive = (path: string) => {
      return currentPath.startsWith(path);
    };
    
    // Estilo base para los botones de navegación
    const navButtonClass = (path: string) => 
      `flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive(path) 
          ? 'font-medium bg-gray-200' 
          : 'opacity-80 hover:opacity-100 hover:bg-gray-100'
      }`;
  
    return (
      <div 
        className="flex items-center gap-2 px-6 py-2 border-t overflow-x-auto relative"
        style={{ borderColor: currentTheme.colors.border }}
      >
        <div 
          className="relative z-10"
        >
          <button
            ref={clinicalHistoryButtonRef}
            onClick={() => setShowClinicalHistorySubmenu(!showClinicalHistorySubmenu)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors relative",
                isActive('/heredo-familial-history') || 
                isActive('/pathological-history') || 
                isActive('/antecedentes-no-patologicos') || 
                isActive('/gyneco-obstetric-history')
                  ? 'bg-secondary/20 text-text font-medium' 
                  : 'opacity-80 hover:opacity-100 hover:bg-black/5',
                showClinicalHistorySubmenu && 'bg-black/10'
              )}
              style={{ 
                position: 'relative',
                color: isActive('/heredo-familial-history') || 
                       isActive('/pathological-history') || 
                       isActive('/antecedentes-no-patologicos') || 
                       isActive('/gyneco-obstetric-history')
                  ? currentTheme.colors.text
                  : currentTheme.colors.textSecondary
              }}
          >
            <FileText className="h-4 w-4" 
              style={{ color: currentTheme.colors.primary }} />
            Ficha Clínica
            {showClinicalHistorySubmenu ? (
              <ChevronUp className="h-3 w-3" style={{ color: currentTheme.colors.headerText }} />
            ) : (
              <ChevronDown className="h-3 w-3" style={{ color: currentTheme.colors.headerText }} />
            )}
            {/* Enhanced Clinical History Count Badge */}
            {clinicalHistoryCount !== null && clinicalHistoryCount > 0 && (
              <span 
                className={clsx(
                  "absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full transition-all duration-200"
                )}
                style={{
                  background: currentTheme.colors.primary,
                  color: currentTheme.colors.buttonText
                }}
                title={`${clinicalHistoryCount} registro${clinicalHistoryCount !== 1 ? 's' : ''} de ficha clínica`}
              >
                {clinicalHistoryCount > 99 ? '99+' : clinicalHistoryCount}
              </span>
            )}
          </button>
          
          {showClinicalHistorySubmenu && (
            <>
              {/* Caret/Arrow pointing up - Fixed positioned */}
              <div 
                className="fixed z-50"
                style={{
                  top: popoverPosition ? popoverPosition.top - 4 : 0,
                  left: popoverPosition && clinicalHistoryButtonRef.current 
                    ? popoverPosition.left + 192 - 8 // Center on popover (192 is half of 384px width)
                    : 0,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: `8px solid ${currentTheme.colors.surface}`,
                  filter: 'drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1))'
                }}
              />
              
              {/* Popover container */}
              <div 
                ref={clinicalHistoryPopoverRef}
                className="fixed py-2 w-80 rounded-lg shadow-xl z-50 border-2 backdrop-blur-sm"
                style={{ 
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.primary,
                  boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${currentTheme.colors.primary}20`,
                  top: popoverPosition?.top || 0,
                  left: popoverPosition?.left +32 || 24,
                  visibility: popoverPosition ? 'visible' : 'hidden',
                }}
              >
                {/* Header del popover */}
                <div 
                  className="px-4 py-2 border-b text-center"
                  style={{ 
                    borderColor: currentTheme.colors.border,
                    background: `${currentTheme.colors.primary}08`
                  }}
                >
                  <h4 
                    className="text-sm font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Ficha Clínica Completa
                  </h4>
                </div>
                
                <Link
                  to="/heredo-familial-history"
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors border-l-4 border-transparent hover:border-current"
                  style={{ color: currentTheme.colors.text }}
                  onClick={() => setShowClinicalHistorySubmenu(false)}
                >
                  <Family className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                  <div>
                    <div className="font-medium">Antecedentes Heredo-Familiares</div>
                    <div className="text-xs opacity-75">Historia familiar de enfermedades</div>
                  </div>
                </Link>
                
                <Link
                  to="/pathological-history"
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors border-l-4 border-transparent hover:border-current"
                  style={{ color: currentTheme.colors.text }}
                  onClick={() => setShowClinicalHistorySubmenu(false)}
                >
                  <Stethoscope className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                  <div>
                    <div className="font-medium">Antecedentes Patológicos</div>
                    <div className="text-xs opacity-75">Enfermedades, cirugías y hospitalizaciones</div>
                  </div>
                </Link>
                               
                <Link
                  to="/antecedentes-no-patologicos"
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors border-l-4 border-transparent hover:border-current"
                  style={{ color: currentTheme.colors.text }}
                  onClick={() => setShowClinicalHistorySubmenu(false)}
                >
                  <Activity className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                  <div>
                    <div className="font-medium">Antecedentes no Patológicos</div>
                    <div className="text-xs opacity-75">Hábitos y estilo de vida</div>
                  </div>
                </Link>
                
                {selectedPatient?.Sexo?.toLowerCase() === 'femenino' && (
                  <Link
                    to="/gyneco-obstetric-history"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors border-l-4 border-transparent hover:border-current"
                    style={{ color: currentTheme.colors.text }}
                    onClick={() => setShowClinicalHistorySubmenu(false)}
                  >
                    <Heart className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                    <div>
                      <div className="font-medium">Antecedentes Gineco-Obstétricos</div>
                      <div className="text-xs opacity-75">Historia ginecológica y obstétrica</div>
                    </div>
                  </Link>
                )}       
              </div>
            </>
          )}
        </div>
        
        <Link
          to="/clinical-evolution"
          className={navButtonClass('/clinical-evolution')}
          style={{ 
            position: 'relative',
            color: currentTheme.colors.text
          }}
        >
          <Activity className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
          Evolución Clínica
          {clinicalEvolutionCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full"
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
          className={navButtonClass('/prescriptions')}
          style={{ 
            position: 'relative',
            color: currentTheme.colors.text
          }}
        >
          <FileSpreadsheet className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
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
          className={navButtonClass('/patient-files')}
          style={{ 
            position: 'relative',
            color: currentTheme.colors.text
          }}
        >
          <FolderOpen className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
          Archivos del Paciente
          {patientFilesCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full"
              style={{
                background: currentTheme.colors.primary,
                color: currentTheme.colors.buttonText
              }}
            >
              {patientFilesCount}
            </span>
          )}
        </Link>
        <Link
          to="/somatometry"
          className={navButtonClass('/somatometry')}
          style={{ 
            position: 'relative',
            color: currentTheme.colors.text
          }}
        >
          <Scale className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
          Somatometrías
          {somatometryCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full"
              style={{
                background: currentTheme.colors.primary,
                color: currentTheme.colors.buttonText
              }}
            >
              {somatometryCount}
            </span>
          )}
        </Link>
        
      </div>
    );
  };

  const renderUserInfo = () => {
    if (selectedPatient) return null;
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
            Bienvenido:
          </span> 
          <span className="font-mono" style={{ color: currentTheme.colors.text }}>
            {userInfo?.nombre || 'No identificado'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
            Rol:
          </span>
          <span className="font-medium" style={{ color: currentTheme.colors.text }}>
            {userInfo?.rol || 'No identificado'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
            Estado:
          </span>
          <span className="font-medium" style={{ color: currentTheme.colors.text }}>
            {userInfo?.estado || 'No estado'}
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
    );
  };

  return (
    <div 
      className="sticky top-0 z-20 border-b"
      style={{
        background: currentTheme.colors.header,
        borderColor: currentTheme.colors.border,
        color: currentTheme.colors.headerText,
      }}
    >
      <div className="h-auto min-h-16 flex items-center px-6 py-3">
        {selectedPatient ? formatPatientInfo() : renderUserInfo()}
      </div>
      {renderPatientNavigation()}

      {/* Modal del Informe */}
      {selectedPatient && (
        <Modal
          isOpen={showReportModal}
          onClose={handleCloseReport}
          title="Ficha de datos del Paciente"
          className="max-w-6xl w-full"
        >
          <PatientReport
            patientId={selectedPatient.id}
            isModalView={true}
            onClose={handleCloseReport}
            patientData={selectedPatient}
          />
        </Modal>
      )}

      {/* Modal del Informe Clínico Integral */}
      {selectedPatient && (
        <Modal
          isOpen={showComprehensiveReportModal}
          onClose={() => setShowComprehensiveReportModal(false)}
          title="Informe Clínico Integral del Paciente"
          className="max-w-6xl w-full"
        >
          <ComprehensiveClinicalHistoryReport
            patientId={selectedPatient.id}
            isModalView={true}
            onClose={() => setShowComprehensiveReportModal(false)}
            patientData={selectedPatient}
          />
        </Modal>
      )}
    </div>
  );
}