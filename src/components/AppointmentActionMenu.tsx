import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Edit,
  Calendar,
  RefreshCw,
  MessageSquare,
  XCircle,
  History,
  Printer,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface Action {
  id: string;
  label: string;
  icon: React.ElementType;
  color?: string;
  disabled?: boolean;
  disabledReason?: string;
  hasSubmenu?: boolean;
  onClick?: () => void;
}

interface AppointmentActionMenuProps {
  appointmentId: string;
  currentStatus: number;
  isPast: boolean;
  isTerminal: boolean;
  allowedStatusTransitions?: Array<{ id: number; estado: string }>;
  onViewDetails: () => void;
  onEdit: () => void;
  onReschedule: () => void;
  onChangeStatus: (newStatusId: number) => void;
  onLoadStatusTransitions?: () => Promise<Array<{ id: number; estado: string }>>;
  onAddNote: () => void;
  onCancel: () => void;
  onViewHistory: () => void;
  onPrint: () => void;
  canEdit?: boolean;
  canCancel?: boolean;
  canChangeStatus?: boolean;
}

export function AppointmentActionMenu({
  appointmentId,
  currentStatus,
  isPast,
  isTerminal,
  allowedStatusTransitions = [],
  onViewDetails,
  onEdit,
  onReschedule,
  onChangeStatus,
  onLoadStatusTransitions,
  onAddNote,
  onCancel,
  onViewHistory,
  onPrint,
  canEdit = true,
  canCancel = true,
  canChangeStatus = true,
}: AppointmentActionMenuProps) {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const [loadedTransitions, setLoadedTransitions] = useState<Array<{ id: number; estado: string }>>([]);
  const [loadingTransitions, setLoadingTransitions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowStatusSubmenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setShowStatusSubmenu(false);
  };

  const handleActionClick = async (action: Action) => {
    if (action.disabled) return;

    if (action.id === 'changeStatus') {
      // Si el submenú ya está abierto, solo cerrarlo
      if (showStatusSubmenu) {
        setShowStatusSubmenu(false);
      } else {
        // Cargar transiciones dinámicamente si hay función para ello
        if (onLoadStatusTransitions && loadedTransitions.length === 0) {
          setLoadingTransitions(true);
          try {
            const transitions = await onLoadStatusTransitions();
            setLoadedTransitions(transitions);
          } catch (error) {
            console.error('Error loading transitions:', error);
          } finally {
            setLoadingTransitions(false);
          }
        }
        setShowStatusSubmenu(true);
      }
    } else {
      action.onClick?.();
      setIsOpen(false);
      setShowStatusSubmenu(false);
    }
  };

  const handleStatusChange = (statusId: number) => {
    onChangeStatus(statusId);
    setIsOpen(false);
    setShowStatusSubmenu(false);
  };

  const actions: Action[] = [
    {
      id: 'view',
      label: 'Ver Detalles',
      icon: Eye,
      color: currentTheme.colors.primary,
      onClick: onViewDetails,
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit,
      color: currentTheme.colors.primary,
      disabled: !canEdit || isPast || isTerminal,
      disabledReason: isTerminal
        ? 'No se puede editar una cita cerrada'
        : isPast
        ? 'No se pueden editar citas pasadas'
        : 'Sin permisos para editar',
      onClick: onEdit,
    },
    {
      id: 'reschedule',
      label: 'Reprogramar',
      icon: Calendar,
      color: '#6366F1',
      disabled: isTerminal,
      disabledReason: 'No se puede reprogramar una cita cerrada',
      onClick: onReschedule,
    },
    {
      id: 'changeStatus',
      label: 'Cambiar Estado',
      icon: RefreshCw,
      color: '#F59E0B',
      disabled: !canChangeStatus || isTerminal,
      disabledReason: isTerminal
        ? 'La cita está en estado terminal'
        : 'Sin permisos para cambiar estado',
      hasSubmenu: true,
    },
    {
      id: 'addNote',
      label: 'Agregar Nota',
      icon: MessageSquare,
      color: '#10B981',
      onClick: onAddNote,
    },
    {
      id: 'cancel',
      label: 'Cancelar Cita',
      icon: XCircle,
      color: '#EF4444',
      disabled: !canCancel || isTerminal || isPast,
      disabledReason: isTerminal
        ? 'La cita ya está cerrada'
        : isPast
        ? 'No se pueden cancelar citas pasadas'
        : 'Sin permisos para cancelar',
      onClick: onCancel,
    },
    {
      id: 'history',
      label: 'Ver Historia Completa',
      icon: History,
      color: '#8B5CF6',
      onClick: onViewHistory,
    },
    {
      id: 'print',
      label: 'Imprimir',
      icon: Printer,
      color: '#6B7280',
      onClick: onPrint,
    },
  ];

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={handleMenuToggle}
        className="p-2 rounded-full hover:bg-black/5 transition-colors"
        style={{ color: currentTheme.colors.textSecondary }}
        aria-label="Abrir menú de acciones"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-1 w-56 rounded-lg shadow-lg z-50 border"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          <div className="py-1">
            {actions.map((action, index) => (
              <div key={action.id} className="relative">
                {index > 0 && index % 3 === 0 && (
                  <div
                    className="my-1 h-px"
                    style={{ background: currentTheme.colors.border }}
                  />
                )}
                <button
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={clsx(
                    'w-full px-4 py-2 text-left flex items-center justify-between transition-colors',
                    action.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-black/5 cursor-pointer'
                  )}
                  style={{ color: currentTheme.colors.text }}
                  title={action.disabled ? action.disabledReason : undefined}
                >
                  <div className="flex items-center gap-3">
                    <action.icon
                      className="h-4 w-4"
                      style={{ color: action.disabled ? currentTheme.colors.textSecondary : action.color }}
                    />
                    <span className="text-sm">{action.label}</span>
                  </div>
                  {action.hasSubmenu && !action.disabled && (
                    <ChevronRight className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                  )}
                </button>

                {action.id === 'changeStatus' && showStatusSubmenu && !action.disabled && (
                  <div
                    className="absolute left-full top-0 ml-1 w-48 rounded-lg shadow-lg border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    <div className="py-1">
                      {loadingTransitions ? (
                        <div className="px-4 py-2 text-sm text-center" style={{ color: currentTheme.colors.textSecondary }}>
                          Cargando...
                        </div>
                      ) : loadedTransitions.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-center" style={{ color: currentTheme.colors.textSecondary }}>
                          No hay estados disponibles
                        </div>
                      ) : (
                        loadedTransitions.map((status) => (
                          <button
                            key={status.id}
                            onClick={() => handleStatusChange(status.id)}
                            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-black/5 transition-colors"
                            style={{ color: currentTheme.colors.text }}
                          >
                            <span className="text-sm">{status.estado}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
