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
    console.log('clearAllTimers: Clearing all timers.'); // Added log
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
    console.log('startCountdown: Starting countdown for', countdownDurationMs / 1000, 'seconds.'); // Added log
    setIsCountingDown(true);
    setRemainingTime(Math.ceil(countdownDurationMs / 1000));

    countdownIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          console.log('Countdown finished. Calling onTimeout.'); // Added log
          clearAllTimers();
          setIsCountingDown(false);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    countdownTimerRef.current = setTimeout(() => {
      console.log('Safety countdown timer finished. Calling onTimeout.'); // Added log
      clearAllTimers();
      setIsCountingDown(false);
      onTimeout();
    }, countdownDurationMs);
  }, [countdownDurationMs, onTimeout, clearAllTimers]);

  const resetTimer = useCallback(() => {
    console.log('resetTimer: Resetting idle timer.', new Date()); // Added log
    clearAllTimers();
    setIsCountingDown(false);
    setRemainingTime(0);

    idleTimerRef.current = setTimeout(() => {
      console.log('Idle timeout reached. Starting countdown.'); // Added log
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

    console.log('useEffect: Initializing idle timer.'); // Added log
    resetTimer();

    return () => {
      console.log('useEffect cleanup: Removing event listeners and clearing timers.'); // Added log
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
