import { useState, useEffect, useRef, useCallback } from 'react';

// ... (interfaz y tipos)

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

  const startCountdown = useCallback(() => {
    setIsCountingDown(true);
    setRemainingTime(Math.ceil(countdownDurationMs / 1000));

    countdownIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearAllTimers();
          setIsCountingDown(false);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    countdownTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setIsCountingDown(false);
      onTimeout();
    }, countdownDurationMs);
  }, [countdownDurationMs, onTimeout, clearAllTimers]);

  const resetTimer = useCallback(() => {
    clearAllTimers();
    setIsCountingDown(false);
    setRemainingTime(0);

    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, idleTimeoutMs);
  }, [idleTimeoutMs, startCountdown, clearAllTimers]);

  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  useEffect(() => {
    const handleActivity = () => {
      if (!isCountingDown) {
        resetTimer();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimer();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearAllTimers();
    };
  }
  )

  return {
    remainingTime,
    isCountingDown,
    resetTimer
  };
}
