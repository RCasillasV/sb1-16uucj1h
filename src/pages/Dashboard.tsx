import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, LayoutDashboard, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { RecentActivityList } from '../components/RecentActivityList';
import clsx from 'clsx'; 

interface StatsCard {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick: () => void;
}

export function Dashboard() {
  const { currentTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats();
    }
  }, [user, authLoading]);

  async function fetchStats() {
    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    try {
      const stats = await api.stats.getDashboardStats();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statsCards: StatsCard[] = [
    {
      title: 'Total Pacientes',
      value: stats.totalPatients,
      icon: Users,
      trend: {
        value: 12,
        isPositive: true,
      },
      onClick: () => navigate('/patients'),
    },
    {
      title: 'Citas para hoy',
      value: stats.todayAppointments,
      icon: Clock,
      onClick: () => navigate('/agenda/agenda', { state: { filter: 'today' } }),
    },
    {
      title: 'Citas confirmadas',
      value: stats.todayAppointmentsConfirm,
      icon: Clock,
      onClick: () => navigate('/agenda/agenda', { state: { filter: 'today' } }),
    },
    {
      title: 'Pacientes en espera',
      value: stats.upcomingAppointments,
       icon: Users,
      trend: {
        value: 5,
        isPositive: true,
      },
      onClick: () => navigate('/agenda/agenda', { state: { filter: 'upcoming' } }),
    },
    {
      title: 'Próxima Cita',
      value: stats.upcomingAppointments,
      icon: Calendar,
      trend: {
        value: 5,
        isPositive: true,
      },
      onClick: () => navigate('/agenda/agenda', { state: { filter: 'upcoming' } }),
    },
    {
      title: 'Tiempo espera Promedio',
      value: stats.upcomingAppointments,
      icon: Clock,
      trend: {
        value: 5,
        isPositive: true,
      },
      onClick: () => navigate('/agenda/agenda', { state: { filter: 'upcoming' } }),
    },
  ];

  const cardStyle = {
    container: clsx(
      'p-2 rounded-lg transition-all duration-200 cursor-pointer',
      currentTheme.buttons.shadow && 'shadow-md hover:shadow-lg',
      currentTheme.buttons.animation && 'hover:scale-102'
    ),
    background: currentTheme.colors.surface,
    border: currentTheme.colors.border,
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutDashboard 
          className="h-6 w-6" 
          style={{ color: currentTheme.colors.primary }} 
        />
        <h1 
          className="text-3xl font-bold"
          style={{ color: currentTheme.colors.text }}
        >
          Dashboard
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {statsCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className={cardStyle.container}
            style={{
              background: cardStyle.background,
              borderColor: cardStyle.border,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 
                  className="text-sm font-medium mb-4"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  {card.title}
                </h2>
                <p 
                  className="text-3xl font-semibold"
                  style={{ color: currentTheme.colors.text }}
                >
                  {(loading || authLoading) ? '...' : card.value}
                </p>
              </div>
              <card.icon 
                className="h-8 w-8" 
                style={{ color: currentTheme.colors.primary }} 
              />
            </div>
            {card.trend && (
              <div className="mt-4 flex items-center">
                {card.trend.isPositive ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span 
                  className={clsx(
                    'ml-1 text-sm',
                    card.trend.isPositive ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {card.trend.value}% este mes
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: currentTheme.colors.primary }}
            />
            <h2
              className="text-xl font-semibold"
              style={{ color: currentTheme.colors.text }}
            >
              Actividad Reciente
            </h2>
          </div>
          <button
            onClick={() => navigate('/activity')}
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: currentTheme.colors.primary }}
          >
            Ver todas
          </button>
        </div>
        <RecentActivityList
          limit={5}
          compact={true}
          onActivityClick={(activity) => {
            // Navegación opcional según el tipo de actividad
            if (activity.id_paciente) {
              navigate(`/patients`);
            } else if (activity.tipo_actividad.startsWith('cita_')) {
              navigate('/agenda/agenda');
            }
          }}
        />
      </div>
    </div>
  );
}