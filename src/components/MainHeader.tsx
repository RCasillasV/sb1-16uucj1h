import React from 'react';  
import { Link } from 'react-router-dom';
import { Mail, Phone, Cake, Baby, Mars, Venus, Clock, MoreVertical, Calendar, FileText, Activity, FileSpreadsheet, FolderOpen, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface MainHeaderProps {
  selectedPatient: Patient | null;
  userInfo: { 
    authId: string; 
    idbu: string | null;
    business_unit: { Nombre: string } | null 
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
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPatientNavigation = () => {
    if (!selectedPatient) return null;
  
    return (
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
    );
  };

  const renderUserInfo = () => {
    if (selectedPatient) return null;
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium\" style={{ color: currentTheme.colors.textSecondary }}>
            Bienvenido : 
          </span>
          <span className="font-mono" style={{ color: currentTheme.colors.text }}>
            {user.userRol|| 'No identificado'}
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
    </div>
  );
}

// Helper function to calculate age
function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  
  let years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  
  let formatted = '';
  if (years < 1) {
    const monthsAge = months + 12;
    formatted = `${monthsAge} ${monthsAge === 1 ? 'mes' : 'meses'}`;
  } else {
    formatted = `${years} ${years === 1 ? 'año' : 'años'}`;
  }
  
  return {
    years,
    formatted
  };
}