import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Hook para obtener evoluciones clínicas de un paciente con caché
 */
export const useClinicalEvolutions = (patientId: string | null) => {
  return useQuery({
    queryKey: ['clinical-evolutions', patientId],
    queryFn: () => api.clinicalEvolution.getByPatientId(patientId!),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutos - datos médicos más frescos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para crear una evolución clínica
 */
export const useCreateClinicalEvolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { patient_id: string; evolution_text: string }) =>
      api.clinicalEvolution.create(data),
    onSuccess: (_, variables) => {
      // Invalida el caché de evoluciones del paciente
      queryClient.invalidateQueries({ 
        queryKey: ['clinical-evolutions', variables.patient_id] 
      });
    },
  });
};

/**
 * Hook para actualizar una evolución clínica
 */
export const useUpdateClinicalEvolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { evolution_text: string } }) =>
      api.clinicalEvolution.update(id, data),
    onSuccess: () => {
      // Invalida todas las evoluciones (no sabemos el patient_id)
      queryClient.invalidateQueries({ queryKey: ['clinical-evolutions'] });
    },
  });
};

/**
 * Hook para eliminar una evolución clínica
 */
export const useDeleteClinicalEvolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.clinicalEvolution.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-evolutions'] });
    },
  });
};
