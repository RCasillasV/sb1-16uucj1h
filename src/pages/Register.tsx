import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Building2, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { DEFAULT_BU } from '../utils/constants';
import clsx from 'clsx';

const registerSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no debe exceder 50 caracteres'),
  email: z.string()
    .email('Ingrese un correo electrónico válido')
    .min(1, 'El correo electrónico es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'Debe aceptar los términos y condiciones',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    Nombre: '',
    Email: '',
    Rol: 'Medico',
    Estado: 'Activo',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const password = watch('password', '');
  const passwordStrengthChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('Este correo electrónico ya está registrado');
        }
        throw signUpError;
      }
      const { error: profileError } = await supabase
        .from('tcUsuarios')
        .insert({
          idusuario: signUpData.user?.id,
          idbu: DEFAULT_BU,
          nombre: data.nombre,
          email: data.email,
          estado: 'Activo',
          rol: 'Medico'
        });

      if (profileError) throw profileError;

      // Redirect to login with success message
      navigate('/login', {
        state: {
          message: 'Registro exitoso. Por favor, revise su correo electrónico para verificar su cuenta.',
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Error al registrar el usuario');
    } finally {
      return () => {
        clearTimeout(timer);
      };
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
      className="min-h-screen flex items-center justify-center px-4"
      style={{ 
        background: currentTheme.colors.background,
        color: currentTheme.colors.text,
      }}
    >
      <div 
        className="w-full max-w-md p-8 rounded-lg shadow-lg"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: currentTheme.colors.primary }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </button>

        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            Crear Cuenta
          </h1>
          <p 
            className="text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Complete el formulario para registrarse
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label 
              htmlFor="nombre" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Nombre Completo
            </label>
            <input
              type="text"
              id="nombre"
              {...register('nombre')}
              className={clsx(
                'w-full pl-4 pr-4 py-2 rounded-md border transition-colors',
                errors.nombre && 'border-red-300'
              )}
              style={{
                background: currentTheme.colors.surface,
                borderColor: errors.nombre 
                  ? '#FCA5A5'
                  : currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
              placeholder="Juan Pérez"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="rol" 
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
                {...register('email')}
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
                {...register('password')}
                className={clsx(
                  'w-full pl-10 pr-12 py-2 rounded-md border transition-colors',
                  errors.password && 'border-red-300'
                )}
                style={{
                  background: currentTheme.colors.surface,
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

            {/* Password strength indicators */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Check 
                  className="h-3 w-3" 
                  style={{ 
                    color: passwordStrengthChecks.length ? '#10B981' : '#9CA3AF'
                  }} 
                />
                <span style={{ color: currentTheme.colors.textSecondary }}>
                  Mínimo 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check 
                  className="h-3 w-3" 
                  style={{ 
                    color: passwordStrengthChecks.uppercase ? '#10B981' : '#9CA3AF'
                  }} 
                />
                <span style={{ color: currentTheme.colors.textSecondary }}>
                  Al menos una mayúscula
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check 
                  className="h-3 w-3" 
                  style={{ 
                    color: passwordStrengthChecks.lowercase ? '#10B981' : '#9CA3AF'
                  }} 
                />
                <span style={{ color: currentTheme.colors.textSecondary }}>
                  Al menos una minúscula
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check 
                  className="h-3 w-3" 
                  style={{ 
                    color: passwordStrengthChecks.number ? '#10B981' : '#9CA3AF'
                  }} 
                />
                <span style={{ color: currentTheme.colors.textSecondary }}>
                  Al menos un número
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Check 
                  className="h-3 w-3" 
                  style={{ 
                    color: passwordStrengthChecks.special ? '#10B981' : '#9CA3AF'
                  }} 
                />
                <span style={{ color: currentTheme.colors.textSecondary }}>
                  Al menos un carácter especial
                </span>
              </div>
            </div>
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
                style={{ color: currentTheme.colors.textSecondary }}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                {...register('confirmPassword')}
                className={clsx(
                  'w-full pl-10 pr-12 py-2 rounded-md border transition-colors',
                  errors.confirmPassword && 'border-red-300'
                )}
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: errors.confirmPassword 
                    ? '#FCA5A5'
                    : currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="acceptTerms"
                {...register('acceptTerms')}
                className="rounded border-gray-300"
              />
            </div>
            <label 
              htmlFor="acceptTerms" 
              className="ml-2 text-sm"
              style={{ color: currentTheme.colors.text }}
            >
              Acepto los{' '}
              <button
                type="button"
                className="underline"
                style={{ color: currentTheme.colors.primary }}
                onClick={() => navigate('/terms')}
              >
                términos y condiciones
              </button>
              {' '}y la{' '}
              <button
                type="button"
                className="underline"
                style={{ color: currentTheme.colors.primary }}
                onClick={() => navigate('/privacy')}
              >
                política de privacidad
              </button>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm text-red-600">
              {errors.acceptTerms.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={clsx(buttonStyle.base, 'disabled:opacity-50')}
            style={buttonStyle.primary}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span className="ml-2">Registrando...</span>
              </div>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}