import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import type { Database } from '../types/database.types';
import { calculateAge } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext'; // Importa useSelectedPatient
import clsx from 'clsx';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];
type SortDirection = 'asc' | 'desc' | null;
type SortField = 'name' | 'age' | 'gender' | null;

// Define constants for different view modes
const MODAL_PATIENTS_PER_PAGE = 8;
const FULL_PATIENTS_PER_PAGE = 10;

interface PatientListSelectorProps {
  onSelectPatient: (patient: Patient) => void;
  onClose?: () => void;
  className?: string;
  isModal?: boolean;
}

export function PatientListSelector({ onSelectPatient, onClose, className = '', isModal = false }: PatientListSelectorProps) {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient(); // Obtén el paciente seleccionado del contexto
  const { user, loading: authLoading } = useAuth();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Determine how many patients to show per page based on view mode
  const patientsPerPage = isModal ? MODAL_PATIENTS_PER_PAGE : FULL_PATIENTS_PER_PAGE;


  useEffect(() => {
    if (!authLoading && user) {
      fetchPatients();
    }
  }, [user, authLoading]);

  async function fetchPatients() {
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.patients.getAll();
      setAllPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los pacientes. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      setSortField(prev => prev === field && sortDirection === 'desc' ? null : field);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const sortPatients = (patients: Patient[]) => {
    if (!sortField || !sortDirection) return patients;

    return [...patients].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        const nameA = `${a.Paterno} ${a.Materno} ${a.Nombre}`.toLowerCase();
        const nameB = `${b.Paterno} ${b.Materno} ${b.Nombre}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'age') {
        const ageA = calculateAge(a.FechaNacimiento).years;
        const ageB = calculateAge(b.FechaNacimiento).years;
        comparison = ageA - ageB;
      } else if (sortField === 'gender') {
        comparison = a.Sexo.localeCompare(b.Sexo);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const filteredPatients = allPatients.filter(patient => 
    `${patient.Nombre} ${patient.Paterno} ${patient.Materno}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.Telefono?.includes(searchTerm)
  );

  const sortedPatients = sortPatients(filteredPatients);
  const totalPages = Math.ceil(sortedPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const displayPatients = sortedPatients.slice(startIndex, startIndex + patientsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const sortButtonStyle = {
    base: 'flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer select-none',
    active: {
      color: currentTheme.colors.primary,
    },
    inactive: {
      color: currentTheme.colors.textSecondary,
    },
  };

  return (
    <div className={clsx('flex flex-col', className)}>
      {error && (
        <div 
          className="mb-4 p-3 rounded-md border-l-4"
          style={{
            background: '#FEE2E2',
            borderLeftColor: '#DC2626',
            color: '#DC2626',
          }}
        >
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: currentTheme.colors.textSecondary }} />
          <input
            type="text"
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={clsx(
              'p-2 rounded-full transition-colors',
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
            )}
            style={{ color: currentTheme.colors.text }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span style={{ color: currentTheme.colors.text }}>
            Página {currentPage} de {totalPages || 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className={clsx(
              'p-2 rounded-full transition-colors',
              currentPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
            )}
            style={{ color: currentTheme.colors.text }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          Mostrando {displayPatients.length} de {sortedPatients.length} pacientes
        </div>
      </div>

      <div className="rounded-lg shadow-lg overflow-hidden flex-1" style={{ background: currentTheme.colors.surface }}>
        <table className="min-w-full divide-y" style={{ borderColor: currentTheme.colors.border }}>
          <thead>
            <tr style={{ background: currentTheme.colors.background }}>
              <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider">
                <button
                  onClick={() => handleSort('name')}
                  className={sortButtonStyle.base}
                  style={sortField === 'name' ? sortButtonStyle.active : sortButtonStyle.inactive}
                >
                  Nombre Completo
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-2 text-center text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                <button className="whitespace-nowrap text-center"
                  onClick={() => handleSort('age')}
                  className={sortButtonStyle.base}
                  style={sortField === 'age' ? sortButtonStyle.active : sortButtonStyle.inactive}
                >
                  Edad
                  {getSortIcon('age')}
                </button>
              </th>
              <th className="px-6 py-2 text-left text-xs font-medium tracking-wider hidden md:table-cell" style={{ color: currentTheme.colors.textSecondary }}>
                Teléfono
              </th>
              <th className="px-6 py-2 text-left text-xs font-medium tracking-wider hidden sm:table-cell">
                <button
                  onClick={() => handleSort('gender')}
                  className={sortButtonStyle.base}
                  style={sortField === 'gender' ? sortButtonStyle.active : sortButtonStyle.inactive}
                >
                  Género
                  {getSortIcon('gender')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
            {(loading || authLoading) ? (
              <tr>
                <td colSpan={5} className="px-6 py-2 text-center" style={{ color: currentTheme.colors.textSecondary }}>
                  {authLoading ? 'Autenticando...' : 'Cargando pacientes...'}
                </td>
              </tr>
            ) : displayPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-2 text-center" style={{ color: currentTheme.colors.textSecondary }}>
                  No hay pacientes registrados
                </td>
              </tr>
            ) : (
              displayPatients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="transition-colors cursor-pointer hover:bg-opacity-5"
                  style={{
                    backgroundColor: selectedPatient?.id === patient.id // Aplica el color si el paciente está seleccionado
                      ? `${currentTheme.colors.primary}20`
                      : 'transparent',
                    color: currentTheme.colors.text,
                  }}
                >
                  <td className="px-6 py-2 whitespace-nowrap">
                    {`${patient.Nombre} ${patient.Paterno} ${patient.Materno || ''}`}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap hidden sm:table-cell">
                    {calculateAge(patient.FechaNacimiento).formatted}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap hidden md:table-cell">{patient.Telefono || '-'}</td>
                  <td className="px-6 py-2 whitespace-nowrap hidden sm:table-cell">{patient.Sexo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
