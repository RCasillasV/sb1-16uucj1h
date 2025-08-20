import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, CalendarDays, LayoutDashboard, FileText, Activity, Settings as SettingsIcon, LogOut, Stethoscope, NotebookTabs, FileSpreadsheet, FolderOpen, UserSquare as RulerSquare, Clock, Contact as Family  } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { RoleBasedNavigation, NavigationItem } from './RoleBasedNavigation';
import clsx from 'clsx';

const baseNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Agenda', href: '/agenda/agenda', icon: Calendar, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Pacientes', href: '/patients', icon: Users, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Citas', href: '/appointments', icon: CalendarDays, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Config. Agenda', href: '/settings/schedule', icon: Clock, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Antecedentes No Patológicos', href: '/antecedentes-no-patologicos', icon: FileText, roles: ['Administrador', 'Medico'] },
  { name: 'Antecedentes Heredo-Familiares', href: '/heredo-familial-history', icon: Family, roles: ['Administrador', 'Medico'] },
  { name: 'Antecedentes Patológicos', href: '/pathological-history', icon: Stethoscope, roles: ['Administrador', 'Medico'] },

/*  
  { name: 'Ficha Clínica', href: '/clinical-history', icon: FileText, roles: ['Administrador', 'Medico'] },
  { name: 'Evolución Clínica', href: '/clinical-evolution', icon: Activity, roles: ['Administrador', 'Medico'] },
  { name: 'Recetas', href: '/prescriptions', icon: FileSpreadsheet, roles: ['Administrador', 'Medico'] },
  { name: 'Somatometría', href: '/somatometry', icon: RulerSquare, roles: ['Administrador', 'Medico'] },
  { name: 'Archivos', href: '/patient-files', icon: FolderOpen, roles: ['Administrador', 'Medico'] },
  { name: 'Catálogos', href: '/cie10', icon: NotebookTabs, roles: ['Administrador', 'Medico'] },
*/  
] as const;
const bottomNavigation: NavigationItem[] = [
  { name: 'Unidades de Negocio', href: '/clinica', icon: Stethoscope, roles: ['Administrador'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['Administrador'] },
  { name: 'Configuración', href: '/settings', icon: SettingsIcon, roles: ['Administrador', 'Medico', 'Recepcionista'] },
  { name: 'Cerrar Sesión', href: '/login', icon: LogOut, roles: ['Administrador', 'Medico', 'Recepcionista'] },
] as const;

interface NavLinkProps {
  item: NavigationItem;
  isActive: boolean;
  isExpanded: boolean;
}

const NavLink: React.FC<NavLinkProps> = React.memo(({ item, isActive, isExpanded }) => {
  const { currentTheme } = useTheme();
  const Icon = item.icon;
  
  return (
    <div className="relative group">
      <Link
        to={item.href}
        onClick={(e) => {
          if (item.onClick) {
            e.preventDefault();
            item.onClick();
          }
        }}
        className={clsx(
          'flex items-center py-2.5 px-3 text-sm transition-all duration-100 relative',
          isActive && 'bg-opacity-10'
        )}
        style={{
          color: currentTheme.colors.sidebarText,
          background: isActive ? currentTheme.colors.sidebarHover : 'transparent',
          zIndex: 1,
        }}
      >
        <Icon 
          className="h-5 w-5 shrink-0" 
          style={{ 
            color: isActive 
              ? currentTheme.colors.sidebarText 
              : currentTheme.colors.sidebarText 
          }}
        />
        <span className={clsx(
          "ml-3 whitespace-nowrap transition-all duration-100", 
          isActive && "font-bold",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>
          {item.name}
        </span>
        {'count' in item && item.count > 0 && (
          <span 
            className={clsx(
              'absolute text-xs rounded-full w-5 h-5 flex items-center justify-center transition-all duration-100',
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
     </Link>
    </div>
  );
});

NavLink.displayName = 'NavLink';

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  userRole: string | null | undefined;
  packageVersion: string;
  handleLogout: () => void;
  isMobile: boolean;
  clinicalEvolutionCount: number;
}

export function Sidebar({ isExpanded, setIsExpanded, userRole, packageVersion, handleLogout, isMobile, clinicalEvolutionCount }: SidebarProps) {
  const { currentTheme } = useTheme();
  const location = useLocation();

  const isMenuItemActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const navigation = useMemo(() => {
    // Filter navigation items based on user role
    let filteredBaseNavigation = RoleBasedNavigation({
      navigationItems: baseNavigation,
      userRole
    });
    
    // Add count to Clinical Evolution item
    filteredBaseNavigation = filteredBaseNavigation.map(item => {
      if (item.href === '/clinical-evolution') {
        return { ...item, count: clinicalEvolutionCount };
      }
      return item;
    });
    
    // Filter bottom navigation items based on user role
    const filteredBottomNavigation = RoleBasedNavigation({
      navigationItems: bottomNavigation.map(item => 
        item.name === 'Cerrar Sesión' 
          ? { ...item, onClick: handleLogout }
          : item
      ),
      userRole
    });
    
    return [
      ...filteredBaseNavigation,
      { type: 'divider' as const },
      ...filteredBottomNavigation
    ];
  }, [handleLogout, userRole, clinicalEvolutionCount]);

  return (
    <div
      className={clsx(
        'fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-100 ease-in-out',
        isExpanded ? 'w-40' : 'w-10'
      )}
      style={{ background: currentTheme.colors.sidebar }}
      onMouseEnter={() => !isMobile && setIsExpanded(true)}
      onMouseLeave={() => !isMobile && setIsExpanded(false)}
    >
      <div className="h-16 flex items-center px-3">
        <Link to="../" className="flex items-center gap-2" style={{ color: currentTheme.colors.sidebarText }}>
          <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0" style={{ background: currentTheme.colors.primary }}>
            <Stethoscope className="w-5 h-5" style={{ color: currentTheme.colors.sidebarText }} />
          </div>
          <span className={clsx(
            "text-base font-bold transition-all duration-100",
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

          return (
            <NavLink 
              key={item.name} 
              item={item} 
              isActive={isMenuItemActive(item.href)} 
              isExpanded={isExpanded} 
            />
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
          "transition-all duration-100",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>
          Versión {packageVersion}
        </span>
      </div>
    </div>
  );
}