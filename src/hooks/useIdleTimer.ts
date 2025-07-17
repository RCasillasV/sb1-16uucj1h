import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  idleTimeoutMs: number; // Tiempo de inactividad antes de iniciar cuenta regresiva
  countdownDurationMs: number; // Duración de la cuenta regresiva
  onTimeout: () => void; // Función a ejecutar cuando expire el tiempo
}

interface UseIdleTimerReturn {
  remainingTime: number; // Tiempo restante en segundos
  isCountingDown: boolean; // Si está en cuenta regresiva
  resetTimer: () => void; // Función para resetear manualmente el timer
}

export function useIdleTimer({
  idleTimeoutMs,
  countdownDurationMs,
  onTimeout
}: UseIdleTimerOptions): UseIdleTimerReturn {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para limpiar todos los timers
  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Función para iniciar la cuenta regresiva
  const startCountdown = useCallback(() => {
    setIsCountingDown(true);
    setRemainingTime(Math.ceil(countdownDurationMs / 1000));

    // Actualizar el tiempo restante cada segundo
    countdownIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          // Tiempo agotado, ejecutar callback y limpiar
          clearAllTimers();
          setIsCountingDown(false);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Timer de seguridad para asegurar que onTimeout se ejecute
    countdownTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setIsCountingDown(false);
      onTimeout();
    }, countdownDurationMs);
  }, [countdownDurationMs, onTimeout, clearAllTimers]);

  // Función para resetear el timer de inactividad
  const resetTimer = useCallback(() => {
    clearAllTimers();
    setIsCountingDown(false);
    setRemainingTime(0);

    // Iniciar nuevo timer de inactividad
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, idleTimeoutMs);
  }, [idleTimeoutMs, startCountdown, clearAllTimers]);

  // Eventos que indican actividad del usuario
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  useEffect(() => {
    // Función que maneja la actividad del usuario
    const handleActivity = () => {
      if (!isCountingDown) {
        resetTimer();
      }
    };

    // Agregar event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Iniciar el timer por primera vez
    resetTimer();

    // Cleanup al desmontar el componente
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearAllTimers();
    };
  }, [isCountingDown, resetTimer, clearAllTimers]);

  return {
    remainingTime,
    isCountingDown,
    resetTimer
  };
}