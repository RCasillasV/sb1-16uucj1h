import React from 'react';  
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Cake, Baby, Mars, Venus, Clock, MoreVertical, Calendar, FileText, Activity, FileSpreadsheet, FolderOpen, User, Printer, ChevronDown, ChevronUp, Heart, Smile as Family } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from './Modal';
import { PatientReport } from './Informes/PatientReport';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateAge } from '../utils/dateUtils';
import clsx from 'clsx';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface MainHeaderProps {
  selectedPatient: Patient | null;
  userInfo: { 
    authId: string; 
    nombre: string | null;
    idbu: string | null;
    business_unit: { Nombre: string } | null;
    rol: string | null;
  };
  clinicalHistoryCount: number;
  clinicalEvolutionCount: number;
  prescriptionsCount: number;
  patientFilesCount: number;
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
  lastAppointment,
  nextAppointment,
  showContextMenu,
  handleContextMenuClick,
  handleDeselectPatient,
  handleEditPatient
}: MainHeaderProps) {
  const { currentTheme } = useTheme();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClinicalHistorySubmenu, setShowClinicalHistorySubmenu] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const clinicalHistoryButtonRef = useRef<HTMLButtonElement>(null);
  const clinicalHistoryPopoverRef = useRef<HTMLDivElement>(null);

  // Calculate popover position when it should be shown
  useEffect(() => {
    if (showClinicalHistorySubmenu && clinicalHistoryButtonRef.current) {
      const calculatePosition = () => {
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
      const left = buttonRect.left + scrollX + 12; // 12px para alinear con el padding-left del icono
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
                <Printer className="h-4 w-4" />
                Ficha de datos
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
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
              showClinicalHistorySubmenu 
                ? "bg-black/10" 
                : "hover:bg-black/5"
            )}
            style={{ position: 'relative' }}
          >
            <FileText className="h-4 w-4" />
            Ficha Clínica
            {showClinicalHistorySubmenu ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {clinicalHistoryCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center rounded-full"
                style={{
                  background: currentTheme.colors.primary,
                  color: currentTheme.colors.buttonText
                }}
              >
                {clinicalHistoryCount}
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
                className="fixed py-2 w-96 rounded-lg shadow-xl z-50 border-2 backdrop-blur-sm"
                style={{ 
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.primary,
                  boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${currentTheme.colors.primary}20`,
                  top: popoverPosition?.top || 0,
                  left: popoverPosition?.left || 0,
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
                  <Family className="h-4 w-4" />
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
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Antecedentes Patológicos</div>
                    <div className="text-xs opacity-75">Enfermedades y cirugías previas</div>
                  </div>
                </Link>
                
                <Link
                  to="/antecedentes-no-patologicos"
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors border-l-4 border-transparent hover:border-current"
                  style={{ color: currentTheme.colors.text }}
                  onClick={() => setShowClinicalHistorySubmenu(false)}
                >
                  <Activity className="h-4 w-4" />
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
                    <Heart className="h-4 w-4" />
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
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-black/5 transition-colors"
          style={{ position: 'relative' }}
        >
          <Activity className="h-4 w-4" />
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
    </div>
  );
}