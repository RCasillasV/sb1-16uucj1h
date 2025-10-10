import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - datos se consideran frescos por 5 min
      gcTime: 1000 * 60 * 30, // 30 minutes - cachea por 30 min
      retry: (failureCount, error: any) => {
        // No retry en errores 4xx (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Max 2 reintentos para otros errores
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // No refetch al cambiar ventana
      refetchOnReconnect: true, // Sí refetch al reconectar internet
      refetchOnMount: true, // Sí refetch al montar componente
      networkMode: 'online', // Solo ejecutar queries cuando esté online
    },
    mutations: {
      retry: 1, // Solo 1 reintento para mutations
      networkMode: 'online',
    },
  },
})
