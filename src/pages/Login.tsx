import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

// Schema for form validation
const loginSchema = z.object({
  email: z.string()
    .min(5, 'El correo debe tener al menos 5 caracteres')
    .max(50, 'El correo no debe exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9.@]+$/, 'Solo se permiten letras, números y puntos')
    .email('Ingrese un correo electrónico válido')
    .min(1, 'El correo electrónico es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(50, 'La contraseña no debe exceder 50 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  console.log('Login component rendering'); // Añadir esta línea
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.state?.message]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    // Check if account is locked
    if (lockoutUntil && new Date() < lockoutUntil) {
      const timeLeft = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000);
      setFormError('email', { 
        type: 'locked',
        message: `Cuenta bloqueada. Intente nuevamente en ${timeLeft} segundos`
      });
      return;
    }

    setLoading(true);
    setError(null);

    // Log authentication attempt
    // Commented out to avoid additional network requests during troubleshooting
    // try {
    //   await supabase.from('auth_logs').insert({
    //     email: data.email,
    //     ip_address: '127.0.0.1', // In production, get real IP
    //     success: false, // Will update on success
    //     user_agent: navigator.userAgent,
    //   });
    // } catch (err) {
    //   console.error('Error logging authentication attempt:', err);
    // }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) { 
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirme su correo electrónico antes de iniciar sesión');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Usuario o contraseña incorrectos');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Demasiados intentos fallidos. Por favor espere unos minutos');
        } else {
          console.error('Login error:', error);
          throw new Error('Error al iniciar sesión. Por favor intente nuevamente');
        }
      }

      if (!authData.session) {
        throw new Error('No se pudo iniciar sesión. Por favor intente nuevamente.');
      }

      // Update auth log on success
      /* try {
        await supabase.from('auth_logs').update({
          success: true,
        }).eq('email', data.email);
      } catch (err) {
        console.error('Error updating auth log:', err);
      }
      */
      // Reset attempts on successful login
      setLoginAttempts(0);
      setLockoutUntil(null);

      // Store session if remember me is checked
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión. Por favor verifique su conexión a internet';
      console.error('Login error:', errorMessage);
      
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock account after 3 failed attempts
      if (newAttempts >= 5) {
        const lockoutTime = new Date();
        lockoutTime.setSeconds(lockoutTime.getSeconds() + 30);
        setLockoutUntil(lockoutTime);
        setFormError('email', {
          type: 'maxAttempts',
          message: 'Demasiados intentos fallidos. Cuenta bloqueada por 30 segundos'
        });
      } else {
        setFormError('password', {
          type: 'credentials',
          message: 'Usuario o contraseña incorrectos'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    base: clsx(
      'w-full px-4 py-2 text-sm font-medium transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ 
        color: currentTheme.colors.text,
      }}
    >
      {/* Dynamic Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.1 }}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-white-abstract-flowing-background-1748-large.mp4" type="video/mp4" />
      </video>

      {/* Content Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent backdrop-blur-sm" />

      <div 
        className="w-full max-w-md p-8 rounded-lg shadow-xl relative backdrop-blur-md"
        style={{ 
          background: `${currentTheme.colors.surface}CC`,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            Bienvenido a DoctorSoft
          </h1>
          <p 
            className="text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Inicie sesión para continuar
            Versión Junio 25
          </p>
        </div>

        {error && (
          <div 
            className="mb-4 p-4 rounded-md text-sm"
            style={{
              background: '#FEE2E2',
              color: '#DC2626',
            }}
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 rounded-md text-sm" style={{ background: '#DEF7EC', color: '#03543F' }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
                style={{ color: currentTheme.colors.textSecondary }}
              />
              <input
                type="email"
                id="email"
                {...register('email', {
                  onChange: () => errors.email && setFormError('email', undefined)
                })}
                className={clsx(
                  'w-full pl-10 pr-4 py-2 rounded-md border transition-colors',
                  errors.email && 'border-red-300'
                )}
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: errors.email 
                    ? '#FCA5A5'
                    : currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
                placeholder="correo@ejemplo.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
                style={{ color: currentTheme.colors.textSecondary }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password', {
                  onChange: () => errors.password && setFormError('password', undefined)
                })}
                className={clsx(
                  'w-full pl-10 pr-12 py-2 rounded-md border transition-colors',
                  errors.password && 'border-red-300'
                )}
                style={{
                  background: errors.password 
                    ? '#FEF2F2' 
                    : currentTheme.colors.surface,
                  borderColor: errors.password 
                    ? '#FCA5A5'
                    : currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span 
                className="ml-2 text-sm"
                style={{ color: currentTheme.colors.text }}
              >
                Recordarme
              </span>
                </label>

            <Link
              to="/register"
              className="text-sm hover:underline"
              style={{ color: currentTheme.colors.primary }}
            >
              Registrarse
            </Link>
            <button
              type="button"
              className="text-sm hover:underline"
              style={{ color: currentTheme.colors.primary }}
              onClick={() => navigate('/forgot-password')}
            >
              ¿Olvidó su contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (lockoutUntil && new Date() < lockoutUntil)}
            className={clsx(buttonStyle.base, 'disabled:opacity-50')}
            style={buttonStyle.primary}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span className="ml-2">Iniciando sesión...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}