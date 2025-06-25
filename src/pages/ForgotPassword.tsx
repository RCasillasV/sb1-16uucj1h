import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

const schema = z.object({
  email: z.string()
    .email('Ingrese un correo electrónico válido')
    .min(1, 'El correo electrónico es requerido'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPassword() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      // Get the current origin for the redirect URL
      const origin = window.location.origin;
      const redirectTo = `${origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: redirectTo,
        }
      );

      if (resetError) {
        // Handle specific error cases
        if (resetError.message.includes('Email rate limit exceeded')) {
          throw new Error('Has excedido el límite de intentos. Por favor, espere unos minutos antes de intentar nuevamente.');
        } else if (resetError.message.includes('User not found')) {
          throw new Error('No existe una cuenta con este correo electrónico.');
        } else if (resetError.message.includes('Email not confirmed')) {
          throw new Error('Esta cuenta de correo electrónico no ha sido confirmada.');
        } else {
          throw new Error('No se pudo enviar el correo de recuperación. Por favor, contacte al soporte técnico.');
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar el correo de recuperación. Por favor, intente nuevamente.');
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
            Recuperar Contraseña
          </h1>
          <p 
            className="text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Ingrese su correo electrónico para recibir instrucciones
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

        {success ? (
          <div 
            className="p-4 rounded-md text-sm mb-6"
            style={{ background: '#DEF7EC', color: '#03543F' }}
          >
            <p className="font-medium mb-2">Correo enviado exitosamente</p>
            <p>Por favor, revise su bandeja de entrada y siga las instrucciones para restablecer su contraseña. Si no encuentra el correo, revise su carpeta de spam.</p>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className={clsx(buttonStyle.base, 'disabled:opacity-50')}
              style={buttonStyle.primary}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span className="ml-2">Enviando...</span>
                </div>
              ) : (
                'Enviar Instrucciones'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}