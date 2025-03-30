import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, LogIn } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

export function Login() {
  const { currentTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailAuthEnabled, setEmailAuthEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkEmailAuth();
  }, []);

  const checkEmailAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'testpassword'
      });

      // If we get an error about email provider being disabled, update state
      if (error?.message?.includes('email_provider_disabled')) {
        setEmailAuthEnabled(false);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAuthEnabled) {
      setError('El inicio de sesión por correo electrónico está deshabilitado. Por favor, contacte al administrador.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          }
        });

        if (error) {
          if (error.message.includes('email_provider_disabled')) {
            throw new Error('El registro por correo electrónico está temporalmente deshabilitado. Por favor, contacte al administrador.');
          }
          throw error;
        }

        setError('Cuenta creada exitosamente. Por favor inicia sesión.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('email_provider_disabled')) {
            throw new Error('El inicio de sesión por correo electrónico está temporalmente deshabilitado. Por favor, contacte al administrador.');
          }
          throw error;
        }

        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    base: clsx(
      'w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors',
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
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{ background: currentTheme.colors.background }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 
          className="text-center text-3xl font-bold mb-8"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Medical CRM
        </h1>
        <h2 
          className="mt-6 text-center text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div 
          className="py-8 px-4 shadow sm:rounded-lg sm:px-10"
          style={{ 
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {!emailAuthEnabled && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-600 rounded-md">
              <p>El inicio de sesión por correo electrónico está deshabilitado. Por favor, contacte al administrador para habilitarlo.</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium"
                style={{ color: currentTheme.colors.text }}
              >
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
                  style={{
                    background: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.border,
                  }}
                  disabled={!emailAuthEnabled}
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium"
                style={{ color: currentTheme.colors.text }}
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2"
                  style={{
                    background: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.border,
                  }}
                  disabled={!emailAuthEnabled}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !emailAuthEnabled}
                className={clsx(buttonStyle.base, 'disabled:opacity-50')}
                style={buttonStyle.primary}
              >
                {loading ? (
                  'Procesando...'
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear cuenta
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar sesión
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm hover:opacity-80 transition-opacity"
              style={{ color: currentTheme.colors.primary }}
              disabled={!emailAuthEnabled}
            >
              {isSignUp
                ? '¿Ya tienes una cuenta? Inicia sesión'
                : '¿No tienes una cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}