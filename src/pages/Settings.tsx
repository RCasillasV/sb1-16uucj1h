import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Search,
  Palette,
  Building2,
  NotebookTabs,
  Folders,
  Printer,
  Activity,
  Users,
  Calendar,
  Info,
  FolderOpen
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';
import { ChevronLeft, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppearanceSettings } from '../components/AppearanceSettings';

interface SettingsCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

function SettingsCard({ icon: Icon, title, description, onClick }: SettingsCardProps) {
  const { currentTheme } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className="group w-full h-full aspect-[3/2] p-5 rounded-lg transition-all duration-100 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
      style={{
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
      }}
    >
      <div className="flex flex-col h-full">
        <Icon 
          className="w-12 h-12 mb-4 transition-transform duration-100 group-hover:scale-110" 
          style={{ color: currentTheme.colors.primary }}
        />
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: currentTheme.colors.text }}
        >
          {title}
        </h3>
        <p 
          className="text-sm leading-relaxed"
          style={{ color: currentTheme.colors.textSecondary }}
        >
          {description}
        </p>
      </div>
    </button>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { 
    currentTheme, 
  } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [activePath, setActivePath] = useState(['Configuración']);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingsCards = [
    {
      icon: Palette,
      title: 'Apariencia',
      description: 'Personaliza tema, colores, tipografía y estilos visuales del sistema.',
      onClick: () => {
        setActivePath(['Configuración', 'Apariencia']);
        setActiveSection('apariencia');
      }
    },
    {
      icon: Building2,
      title: 'Cuenta y Organización',
      description: 'Gestiona lod datos de la clinica, usuarios, roles y subscripción a DoctorSoft',
      onClick: () => {
        setActivePath(['Configuración', 'Cuenta y Organización']);
        navigate('/clinica');
      }
    },
    {
      icon:Users, 
      title: 'Usuarios',
      description: 'Administra los usuarios, roles y permisos del sistema',
      onClick: () => navigate('/users')
    },
    {
      icon: NotebookTabs,
      title: 'Aseguradoras',
      description: 'Personaliza las aseguradoras que los pacientes, el contacto y las condiciones que se podrán registrar',
      onClick: () => navigate('/insurance')
    },
    {
      icon: Folders,
      title: 'Catálogo de Diagnósticos',
      description: 'Configura el catálogos de diagnósticos (CIE-10) y sintomas recurrentes',
      onClick: () => {
        setActivePath(['Configuración', 'Catálogos Generales']);
        navigate('/cie10');
      }
    },
    {
      icon: Printer,
      title: 'Formatos y documentos',
      description: 'Gestiona como se visualizaran para impresión los documentos ',
      onClick: () => setActivePath(['Configuración', 'Privacidad'])
    },
    {
      icon: FolderOpen,
      title: 'Expediente Clinico',
      description: 'Configuración según NOM-004 de las historías clinica',
      onClick: () => setActivePath(['Configuración', 'Expediente Clinico'])
    },
    {
      icon: Building2,
      title: 'Facturas',
      description: 'Información de PAC y CFDI para facturación',
      onClick: () => setActivePath(['Configuración', 'Facturas']),
    },
    {
      icon: Calendar,
      title: 'Agenda y Consultorios',
      description: 'Configuración general de la agenda y los consultorios de DoctorSoft.',
      onClick: () => setActivePath(['Configuración', 'Sistema'])
    },
    {
      icon: Info,
      title: 'Acerca de',
      description: 'Información sobre la versión,  licencias y soporte',
      onClick: () => setActivePath(['Configuración', 'Acerca de'])
    }
  ];

  const filteredCards = settingsCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBack = () => {
    setActivePath(['Configuración']);
    setActiveSection(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-8">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 py-4 mb-1"
        style={{ background: currentTheme.colors.background }}
      >
        <div className="flex flex-col gap-2">
          {/* Title and breadcrumbs */}
          <div>
            <div className="flex items-center gap-3">
              {activeSection && (
                <button
                  onClick={handleBack}
                  className="p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" style={{ color: currentTheme.colors.text }} />
                </button>
              )}
              <SettingsIcon 
                className="h-6 w-6" 
                style={{ color: currentTheme.colors.primary }} 
              />
              <h1 
                className="text-3xl font-bold"
                style={{ 
                  color: currentTheme.colors.text,
                  fontFamily: currentTheme.typography.fontFamily,
                }}
              >
                Configuración
              </h1>
            </div>
            <div 
              className="mt-1 text-sm"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {activePath.join(' > ')}
            </div>
          </div>

          {/* Search bar */}
          {!activeSection && (
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
                style={{ color: currentTheme.colors.textSecondary }} 
              />
              <input
                type="text"
                placeholder="Buscar configuración..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {activeSection === 'apariencia' ? (

        <AppearanceSettings />
      ) : (
        /* Settings Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCards.map((card, index) => (
            <SettingsCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              onClick={card.onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}