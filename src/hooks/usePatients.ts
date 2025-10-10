import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

/**
 * Hook para obtener todos los pacientes con caché
 * Los datos se cachean por 5 minutos
 */
export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => api.patients.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados "frescos"
    gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en caché (antes cacheTime)
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
  });
};

/**
 * Hook para obtener un paciente específico
 */
export const usePatient = (patientId: string | null) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => api.patients.getById(patientId!),
    enabled: !!patientId, // Solo ejecuta si hay patientId
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para crear un paciente con invalidación de caché
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) =>
      api.patients.create(patientData),
    onSuccess: () => {
      // Invalida el caché de pacientes para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

/**
 * Hook para actualizar un paciente
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      api.patients.update(id, data),
    onSuccess: (_, variables) => {
      // Invalida tanto la lista como el paciente específico
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
    },
  });
};

/**
 * Hook para eliminar un paciente
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) => api.patients.delete(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};
