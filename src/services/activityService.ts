import { supabase } from '../lib/supabase';
import { requireSession, getIdbu } from '../lib/supabaseUtils';
import type {
  Activity,
  ActivityFilters,
  ActivityStats,
  CreateActivityPayload,
  ActivityType,
} from '../types/activity.types';

class ActivityService {
  private readonly tableName = '"tcActividadReciente"';

  /**
   * Obtener actividades recientes con paginación
   */
  async getRecentActivities(
    limit: number = 10,
    offset: number = 0
  ): Promise<Activity[]> {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('idbu', idbu)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener actividades filtradas
   */
  async getFilteredActivities(
    filters: ActivityFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<Activity[]> {
    const idbu = await getIdbu();

    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('idbu', idbu);

    // Aplicar filtros
    if (filters.tipos && filters.tipos.length > 0) {
      query = query.in('tipo_actividad', filters.tipos);
    }

    if (filters.fechaInicio) {
      query = query.gte('created_at', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('created_at', filters.fechaFin);
    }

    if (filters.idUsuario) {
      query = query.eq('id_usuario', filters.idUsuario);
    }

    if (filters.idPaciente) {
      query = query.eq('id_paciente', filters.idPaciente);
    }

    if (filters.esCritico !== undefined) {
      query = query.eq('es_critico', filters.esCritico);
    }

    if (filters.busqueda) {
      query = query.or(
        `descripcion.ilike.%${filters.busqueda}%,descripcion_detalle.ilike.%${filters.busqueda}%,nombre_paciente.ilike.%${filters.busqueda}%`
      );
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener actividades por tipo específico
   */
  async getActivitiesByType(
    tipo: ActivityType,
    limit: number = 20
  ): Promise<Activity[]> {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('idbu', idbu)
      .eq('tipo_actividad', tipo)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener actividades de un paciente específico
   */
  async getActivitiesByPatient(
    patientId: string,
    limit: number = 20
  ): Promise<Activity[]> {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('idbu', idbu)
      .eq('id_paciente', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener actividades por rango de fechas
   */
  async getActivitiesByDateRange(
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<Activity[]> {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('idbu', idbu)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener estadísticas de actividad
   */
  async getActivityStats(period: 'day' | 'week' | 'month' = 'day'): Promise<ActivityStats> {
    const idbu = await getIdbu();

    // Calcular fecha de inicio según el período
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    // Obtener todas las actividades del período
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('idbu', idbu)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const activities = data || [];

    // Calcular estadísticas
    const stats: ActivityStats = {
      totalHoy: 0,
      totalSemana: 0,
      totalMes: 0,
      porTipo: {
        cita_nueva: 0,
        cita_actualizada: 0,
        cita_cancelada: 0,
        cita_completada: 0,
        paciente_nuevo: 0,
        paciente_actualizado: 0,
        receta: 0,
        historia_clinica: 0,
        evolucion: 0,
        documento: 0,
        sistema: 0,
      },
    };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    // Conteo por usuario
    const userCounts: Record<string, { nombre: string; count: number }> = {};

    activities.forEach((activity) => {
      const activityDate = new Date(activity.created_at);

      // Contar por período
      if (activityDate >= hoy) stats.totalHoy++;
      if (activityDate >= hace7Dias) stats.totalSemana++;
      if (activityDate >= hace30Dias) stats.totalMes++;

      // Contar por tipo
      if (activity.tipo_actividad in stats.porTipo) {
        stats.porTipo[activity.tipo_actividad as ActivityType]++;
      }

      // Contar por usuario
      if (activity.id_usuario && activity.nombre_usuario) {
        if (!userCounts[activity.id_usuario]) {
          userCounts[activity.id_usuario] = {
            nombre: activity.nombre_usuario,
            count: 0,
          };
        }
        userCounts[activity.id_usuario].count++;
      }
    });

    // Encontrar usuario más activo
    let maxCount = 0;
    let mostActiveUser: { id: string; nombre: string; cantidad: number } | undefined;

    Object.entries(userCounts).forEach(([id, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mostActiveUser = {
          id,
          nombre: data.nombre,
          cantidad: data.count,
        };
      }
    });

    if (mostActiveUser) {
      stats.usuarioMasActivo = mostActiveUser;
    }

    return stats;
  }

  /**
   * Crear actividad manualmente
   */
  async createManualActivity(payload: CreateActivityPayload): Promise<Activity> {
    const user = await requireSession();
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([
        {
          ...payload,
          id_usuario: user.id,
          idbu,
          metadatos: payload.metadatos || {},
          es_critico: payload.es_critico || false,
          icono: payload.icono || 'Activity',
          color: payload.color || '#3B82F6',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Ejecutar limpieza de actividades antiguas
   */
  async cleanOldActivities(): Promise<{ idbu: string; deleted: number }[]> {
    const { data, error } = await supabase.rpc('fn_limpiar_actividades_antiguas');

    if (error) throw error;

    return (data || []).map((item: any) => ({
      idbu: item.idbu_limpiado,
      deleted: item.registros_eliminados,
    }));
  }

  /**
   * Obtener configuración de actividades para el BU actual
   */
  async getActivityConfig() {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from('tcBu')
      .select('dias_retencion_actividad, notificaciones_realtime, exportar_actividades')
      .eq('idBu', idbu)
      .single();

    if (error) throw error;

    return {
      diasRetencion: data.dias_retencion_actividad,
      notificacionesRealtime: data.notificaciones_realtime,
      exportarActividades: data.exportar_actividades,
    };
  }

  /**
   * Actualizar configuración de actividades para el BU actual
   */
  async updateActivityConfig(config: {
    diasRetencion?: number;
    notificacionesRealtime?: boolean;
    exportarActividades?: boolean;
  }) {
    const idbu = await getIdbu();

    const updateData: any = {};
    if (config.diasRetencion !== undefined) {
      updateData.dias_retencion_actividad = config.diasRetencion;
    }
    if (config.notificacionesRealtime !== undefined) {
      updateData.notificaciones_realtime = config.notificacionesRealtime;
    }
    if (config.exportarActividades !== undefined) {
      updateData.exportar_actividades = config.exportarActividades;
    }

    const { error } = await supabase
      .from('tcBu')
      .update(updateData)
      .eq('idBu', idbu);

    if (error) throw error;
  }

  /**
   * Contar total de actividades con filtros
   */
  async countActivities(filters?: ActivityFilters): Promise<number> {
    const idbu = await getIdbu();

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('idbu', idbu);

    // Aplicar filtros si existen
    if (filters) {
      if (filters.tipos && filters.tipos.length > 0) {
        query = query.in('tipo_actividad', filters.tipos);
      }
      if (filters.fechaInicio) {
        query = query.gte('created_at', filters.fechaInicio);
      }
      if (filters.fechaFin) {
        query = query.lte('created_at', filters.fechaFin);
      }
      if (filters.idPaciente) {
        query = query.eq('id_paciente', filters.idPaciente);
      }
      if (filters.esCritico !== undefined) {
        query = query.eq('es_critico', filters.esCritico);
      }
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }
}

export const activityService = new ActivityService();
