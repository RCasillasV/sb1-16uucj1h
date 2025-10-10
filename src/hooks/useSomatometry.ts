import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { somatometryService } from '../services/somatometryService';
import type { SomatometryInsert, SomatometryUpdate } from '../types/somatometry';

/**
 * Hook para obtener somatometrías de un paciente con caché
 */
export const useSomatometries = (patientId: string | null) => {
  return useQuery({
    queryKey: ['somatometries', patientId],
    queryFn: () => somatometryService.getByPatient(patientId!),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook para obtener la última somatometría de un paciente
 */
export const useLatestSomatometry = (patientId: string | null) => {
  return useQuery({
    queryKey: ['somatometry', 'latest', patientId],
    queryFn: () => somatometryService.getLatestByPatient(patientId!),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook para obtener datos OMS de peso
 */
export const useWHOWeightData = (gender: 'M' | 'F') => {
  return useQuery({
    queryKey: ['who-weight', gender],
    queryFn: () => somatometryService.getCompleteWHOWeightData(gender),
    staleTime: 60 * 60 * 1000, // 1 hora - datos OMS no cambian
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
  });
};

/**
 * Hook para obtener datos OMS de altura
 */
export const useWHOHeightData = (gender: 'M' | 'F') => {
  return useQuery({
    queryKey: ['who-height', gender],
    queryFn: () => somatometryService.getCompleteWHOHeightData(gender),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
};

/**
 * Hook para obtener datos OMS de IMC
 */
export const useWHOBMIData = (gender: 'M' | 'F') => {
  return useQuery({
    queryKey: ['who-bmi', gender],
    queryFn: () => somatometryService.getCompleteWHOBMIData(gender),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
};

/**
 * Hook para obtener datos OMS de perímetro cefálico
 */
export const useWHOHeadCircumferenceData = (gender: 'M' | 'F') => {
  return useQuery({
    queryKey: ['who-head', gender],
    queryFn: () => somatometryService.getCompleteWHOHeadCircumferenceData(gender),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
};

/**
 * Hook para crear una somatometría
 */
export const useCreateSomatometry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SomatometryInsert) => somatometryService.create(data),
    onSuccess: (_, variables) => {
      // Invalida el caché de somatometrías del paciente
      queryClient.invalidateQueries({ 
        queryKey: ['somatometries', variables.patient_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['somatometry', 'latest', variables.patient_id] 
      });
    },
  });
};

/**
 * Hook para actualizar una somatometría
 */
export const useUpdateSomatometry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SomatometryUpdate }) =>
      somatometryService.update(id, data),
    onSuccess: (result) => {
      // Invalida el caché del paciente
      queryClient.invalidateQueries({ 
        queryKey: ['somatometries', result.patient_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['somatometry', 'latest', result.patient_id] 
      });
    },
  });
};

/**
 * Hook para eliminar una somatometría
 */
export const useDeleteSomatometry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => somatometryService.delete(id),
    onSuccess: () => {
      // Invalida todas las somatometrías (no sabemos el patient_id)
      queryClient.invalidateQueries({ queryKey: ['somatometries'] });
      queryClient.invalidateQueries({ queryKey: ['somatometry'] });
    },
  });
};
