import React, { useState } from 'react';
import { api } from '../lib/api';
import type { Database } from '../types/database.types';
import { User } from 'lucide-react';
import { format } from 'date-fns';
import { calculateAge } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientFormProps {
  onSuccess: (patient: Patient) => void;
  onCancel: () => void;
  patient?: Patient;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  const { currentTheme } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg p-6 max-w-md w-full mx-4"
        style={{ background: currentTheme.colors.surface }}
      >
        <h3 
          className="text-lg font-medium mb-2"
          style={{ color: currentTheme.colors.text }}
        >
          ¿Está seguro de modificar los datos del paciente?
        </h3>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border transition-colors"
            style={{
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
              background: 'transparent',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md transition-colors"
            style={{
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export function PatientForm({ onSuccess, onCancel, patient }: PatientFormProps) {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState(patient?.postal_code || '');
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<HTMLFormElement | null>(null);

  const validatePostalCode = (value: string) => {
    if (value && !/^\d{5}$/.test(value)) {
      setPostalCodeError('El código postal debe tener exactamente 5 dígitos');
      return false;
    }
    setPostalCodeError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validatePostalCode(postalCode)) {
      return;
    }

    if (patient) {
      setFormData(e.currentTarget as HTMLFormElement);
      setShowConfirmDialog(true);
    } else {
      await savePatient(e.currentTarget);
    }
  };

  const savePatient = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    setLoading(true);
    setError(null);

    const patientData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      paternal_surname: formData.get('paternal_surname') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: formData.get('gender') as string,
      curp: formData.get('curp') as string || null,
      postal_code: postalCode || null,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      address: formData.get('address') as string || null,
      blood_type: formData.get('blood_type') as string || null,
      occupation: formData.get('occupation') as string || null,
      emergency_contact: formData.get('emergency_contact') as string || null,
      allergies: formData.get('allergies') ? (formData.get('allergies') as string).split(',').map(a => a.trim()) : null,
    };

    try {
      let savedPatient: Patient;
      if (patient) {
        savedPatient = await api.patients.update(patient.id, patientData);
      } else {
        savedPatient = await api.patients.create(patientData);
      }
      onSuccess(savedPatient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEdit = async () => {
    if (formData) {
      await savePatient(formData);
    }
    setShowConfirmDialog(false);
  };

  const inputStyle = {
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    borderColor: currentTheme.colors.border,
  };

  const labelStyle = {
    color: currentTheme.colors.textSecondary,
    fontSize: `calc(${currentTheme.typography.baseSize} * 0.875)`,
  };

  return (
    <div 
      className="p-6 rounded-lg shadow-lg max-w-4xl mx-auto"
      style={{ background: currentTheme.colors.surface }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="p-2 rounded-full"
          style={{ background: currentTheme.colors.primary }}
        >
          <User className="h-6 w-6" style={{ color: currentTheme.colors.buttonText }} />
        </div>
        <h2 
          className="text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          {patient ? 'Editar Paciente' : 'Nuevo Paciente'}
        </h2>
      </div>
      
      {error && (
        <div 
          className="mb-2 p-4 rounded-md"
          style={{ 
            background: '#FEE2E2',
            borderColor: '#FCA5A5',
            color: '#DC2626'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="first_name" className="block mb-1 font-medium" style={labelStyle}>
              Nombre
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              required
              defaultValue={patient?.first_name}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="paternal_surname" className="block mb-1 font-medium" style={labelStyle}>
              Apellido Paterno
            </label>
            <input
              type="text"
              name="paternal_surname"
              id="paternal_surname"
              required
              defaultValue={patient?.paternal_surname}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block mb-1 font-medium" style={labelStyle}>
              Apellido Materno
            </label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              defaultValue={patient?.last_name}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="curp" className="block mb-1 font-medium" style={labelStyle}>
              CURP
            </label>
            <input
              type="text"
              name="curp"
              id="curp"
              maxLength={18}
              defaultValue={patient?.curp || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="date_of_birth" className="block mb-1 font-medium" style={labelStyle}>
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="date_of_birth"
              id="date_of_birth"
              required
              defaultValue={patient?.date_of_birth}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="gender" className="block mb-1 font-medium" style={labelStyle}>
              Género
            </label>
            <select
              name="gender"
              id="gender"
              required
              defaultValue={patient?.gender}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block mb-1 font-medium" style={labelStyle}>
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              defaultValue={patient?.email || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block mb-1 font-medium" style={labelStyle}>
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              defaultValue={patient?.phone || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="postal_code" className="block mb-1 font-medium" style={labelStyle}>
              Código Postal
            </label>
            <input
              type="text"
              name="postal_code"
              id="postal_code"
              value={postalCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                setPostalCode(value);
                validatePostalCode(value);
              }}
              className={clsx(
                "w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors",
                postalCodeError ? "border-red-300" : ""
              )}
              style={inputStyle}
            />
            {postalCodeError && (
              <p className="mt-1 text-sm text-red-600">{postalCodeError}</p>
            )}
          </div>

          <div className="col-span-3">
            <label htmlFor="address" className="block mb-1 font-medium" style={labelStyle}>
              Dirección
            </label>
            <input
              type="text"
              name="address"
              id="address"
              defaultValue={patient?.address || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="blood_type" className="block mb-1 font-medium" style={labelStyle}>
              Tipo de Sangre
            </label>
            <select
              name="blood_type"
              id="blood_type"
              defaultValue={patient?.blood_type || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            >
              <option value="">Seleccionar...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label htmlFor="occupation" className="block mb-1 font-medium" style={labelStyle}>
              Ocupación
            </label>
            <input
              type="text"
              name="occupation"
              id="occupation"
              defaultValue={patient?.occupation || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="allergies" className="block mb-1 font-medium" style={labelStyle}>
              Alergias (separadas por comas)
            </label>
            <input
              type="text"
              name="allergies"
              id="allergies"
              placeholder="Penicilina, Látex, etc."
              defaultValue={patient?.allergies?.join(', ') || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="emergency_contact" className="block mb-1 font-medium" style={labelStyle}>
              Contacto de Emergencia
            </label>
            <input
              type="text"
              name="emergency_contact"
              id="emergency_contact"
              defaultValue={patient?.emergency_contact || ''}
              className="w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border transition-colors"
            style={{
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
              background: 'transparent',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !!postalCodeError}
            className="px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmEdit}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}