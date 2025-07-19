import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

// --- Componente reutilizable para campos de entrada ---
function InputField({
  icon, type, id, placeholder, error, register, showToggle, showPassword, onToggleShowPassword
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{placeholder}</label>
      <div className="relative">
        {icon}
        <input
          type={showToggle && showPassword ? 'text' : type}
          id={id}
          {...register}
          className={clsx(
            'w-full pl-10 pr-12 py-2 rounded-md border transition-colors',
            error && 'border-red-300'
          )}
        />
        {showToggle && (
          <button type="button" onClick={onToggleShowPassword} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// --- Hook para mensajes temporales ---
function useTemporaryMessage(message, duration = 10000) {
  const [msg, setMsg] = useState(message);
  useEffect(() => {
    if (message) {
      setMsg(message);
      const timer = setTimeout(() => setMsg(null), duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);
  return [msg, setMsg];
}

// --- Esquema de validación con Zod ---
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
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  // Mensaje de éxito temporal
  const [successMessage, setSuccessMessage] = useTemporaryMessage(location.state?.message);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
    mode: 'onChange',
  });

  // Handler de login
  const onSubmit = async (data: LoginFormData) => {
    if (lockoutUntil && new Date() < lockoutUntil) {
      const timeLeft = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000);
      setError('email', { type: 'locked', message: `Cuenta bloqueada. Intente nuevamente en ${timeLeft} segundos` });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('email', { type: 'manual', message: 'Por favor confirme su correo electrónico antes de iniciar sesión' });
        } else if (error.message.includes('Invalid login credentials')) {
          setError('email', { type: 'manual', message: 'Usuario o contraseña incorrectos' });
          setLoginAttempts((prev) => {
            const attempts = prev + 1;
            if (attempts >= 5) setLockoutUntil(new Date(Date.now() + 60 * 1000));
            return attempts;
          });
        } else if (error.message.includes('Too many requests')) {
          setError('email', { type: 'manual', message: 'Demasiados intentos fallidos. Por favor espere unos minutos' });
        } else {
          setError('email', { type: 'manual', message: 'Error inesperado. Intente más tarde.' });
        }
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  // Estilos para el botón
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ color: currentTheme.colors.text }}>
     {/* Fondo dinámico */}
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.5 }}>
        <source src="/assets/istockphoto-1483562425-640_adpp_is.mp4" type="video/mp4" />
      </video>

    
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent backdrop-blur-sm" />
      <div className="w-full max-w-md p-8 rounded-lg shadow-xl relative backdrop-blur-md" style={{ background: currentTheme.colors.surface }}>
        {/* Encabezado de marca o logo */}
        <div className="flex flex-col items-center mb-6">
           {<img src="/assets/images/Logo.png" alt="Logo" className="h-10 mb-2" /> }
          <h1 className="text-3xl font-bold mb-2" style={{ color: currentTheme.colors.primary }}>
            DoctorSoft
          </h1>
          <h2 className="text-xl font-semibold" style={{ color: currentTheme.colors.text }}>
            Iniciar Sesión
          </h2>
          <p className="text-sm mt-1 text-gray-500">Bienvenido, ingrese sus credenciales para continuar</p>
        </div>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="mb-4 text-green-700 bg-green-100 rounded p-2 text-center">{successMessage}</div>
        )}
        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <InputField
            icon={<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: currentTheme.colors.textSecondary }} />}
            type="email"
            id="email"
            placeholder="Correo Electrónico"
            error={errors.email?.message}
            register={register('email', {
              onChange: () => errors.email && clearErrors('email')
            })}
          />
          <InputField
            icon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: currentTheme.colors.textSecondary }} />}
            type="password"
            id="password"
            placeholder="Contraseña"
            error={errors.password?.message}
            register={register('password', {
              onChange: () => errors.password && clearErrors('password')
            })}
            showToggle
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((prev) => !prev)}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm" style={{ color: currentTheme.colors.text }}>Recordarme</span>
            </label>
            <Link to="/register" className="text-sm hover:underline" style={{ color: currentTheme.colors.primary }}>Registrarse</Link>
            <button type="button" className="text-sm hover:underline" style={{ color: currentTheme.colors.primary }} onClick={() => navigate('/forgot-password')}>¿Olvidó su contraseña?</button>
          </div>
          <button type="submit" disabled={loading || (lockoutUntil && new Date() < lockoutUntil)} className={clsx(buttonStyle.base, 'disabled:opacity-50')} style={buttonStyle.primary}>
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