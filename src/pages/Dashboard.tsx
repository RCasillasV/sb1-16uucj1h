import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, LayoutDashboard, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{
    date: Date;
    type: string;
    description: string;
  }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  async function fetchStats() {
    try {
      const stats = await api.stats.getDashboardStats();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentActivity() {
    // Simulated recent activity data
    const activity = [
      {
        date: new Date(),
        type: 'appointment',
        description: 'Nueva cita programada con Juan Pérez',
      },
      {
        date: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'patient',
        description: 'Registro de nuevo paciente: María García',
      },
      {
        date: new Date(Date.now() - 7200000), // 2 hours ago
        type: 'prescription',
        description: 'Receta emitida para Carlos López',
      },
    ];
    setRecentActivity(activity);
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
      title: 'Próximas Citas',
      value: stats.upcomingAppointments,
      icon: Calendar,
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
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Dashboard
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                  {loading ? '...' : card.value}
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
        <div className="flex items-center gap-2 mb-2">
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
        <div 
          className="rounded-lg overflow-hidden"
          style={{ 
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          {recentActivity.length === 0 ? (
            <div 
              className="p-6 text-center"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              No hay actividad reciente
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                  style={{ 
                    color: currentTheme.colors.text,
                    background: index % 2 === 0 ? 'transparent' : `${currentTheme.colors.background}20`,
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p 
                      className="text-sm"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      {format(activity.date, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}