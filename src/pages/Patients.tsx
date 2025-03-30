import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Users, Edit, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../lib/api';
import type { Database } from '../types/database.types';
import { PatientForm } from '../components/PatientForm';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { calculateAge } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

type Patient = Database['public']['Tables']['patients']['Row'];
type SortDirection = 'asc' | 'desc' | null;
type SortField = 'name' | 'age' | 'gender' | null;

const PATIENTS_PER_PAGE = 12;

export function Patients() {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { currentTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const data = await api.patients.getAll();
      setAllPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
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
        const nameA = `${a.paternal_surname} ${a.last_name} ${a.first_name}`.toLowerCase();
        const nameB = `${b.paternal_surname} ${b.last_name} ${b.first_name}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'age') {
        const ageA = calculateAge(a.date_of_birth).years;
        const ageB = calculateAge(b.date_of_birth).years;
        comparison = ageA - ageB;
      } else if (sortField === 'gender') {
        comparison = a.gender.localeCompare(b.gender);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const filteredPatients = allPatients.filter(patient => 
    `${patient.first_name} ${patient.paternal_surname} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  const sortedPatients = sortPatients(filteredPatients);
  const totalPages = Math.ceil(sortedPatients.length / PATIENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PATIENTS_PER_PAGE;
  const displayPatients = sortedPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE);

  const handlePatientCreated = (newPatient: Patient) => {
    setShowForm(false);
    setSelectedPatientForEdit(null);
    setSelectedPatient(newPatient);
    fetchPatients();
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleEditPatient = () => {
    if (selectedPatient) {
      setSelectedPatientForEdit(selectedPatient);
      setShowForm(true);
    }
  };

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

  const buttonStyle = {
    base: clsx(
      'flex items-center px-4 py-2 transition-all duration-200',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
    secondary: {
      background: currentTheme.colors.buttonSecondary,
      color: currentTheme.colors.buttonText,
    },
  };

  const sortButtonStyle = {
    base: 'flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer select-none',
    active: {
      color: currentTheme.colors.primary,
    },
    inactive: {
      color: currentTheme.colors.textSecondary,
    },
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <PatientForm
          onSuccess={handlePatientCreated}
          onCancel={() => {
            setShowForm(false);
            setSelectedPatientForEdit(null);
          }}
          patient={selectedPatientForEdit}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" style={{ color: currentTheme.colors.text }} />
          <h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>
            Pacientes
          </h1>
        </div>
        <div className="flex gap-2">
          {selectedPatient && (
            <button
              onClick={handleEditPatient}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
            >
              <Edit className="h-5 w-5 mr-2" />
              Editar Paciente
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Nuevo Paciente
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-4" style={{ color: currentTheme.colors.textSecondary }} />
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
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={clsx(
              'p-2 rounded-full transition-colors',
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
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

      <div className="rounded-lg shadow-lg overflow-hidden" style={{ background: currentTheme.colors.surface }}>
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
              <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                <button
                  onClick={() => handleSort('age')}
                  className={sortButtonStyle.base}
                  style={sortField === 'age' ? sortButtonStyle.active : sortButtonStyle.inactive}
                >
                  Edad
                  {getSortIcon('age')}
                </button>
              </th>
              <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: currentTheme.colors.textSecondary }}>
                Teléfono
              </th>
              <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: currentTheme.colors.textSecondary }}>
                Email
              </th>
              <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-2 text-center" style={{ color: currentTheme.colors.textSecondary }}>
                  Cargando pacientes...
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
                  onClick={() => handlePatientClick(patient)}
                  className="transition-colors cursor-pointer hover:bg-opacity-5"
                  style={{
                    backgroundColor: selectedPatient?.id === patient.id 
                      ? `${currentTheme.colors.primary}20`
                      : 'transparent',
                    color: currentTheme.colors.text,
                  }}
                >
                  <td className="px-6 py-2 whitespace-nowrap">
                    {`${patient.first_name} ${patient.paternal_surname} ${patient.last_name}`}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap hidden sm:table-cell">
                    {calculateAge(patient.date_of_birth).formatted}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap hidden md:table-cell">{patient.phone || '-'}</td>
                  <td className="px-6 py-2 whitespace-nowrap hidden lg:table-cell">{patient.email || '-'}</td>
                  <td className="px-6 py-2 whitespace-nowrap hidden sm:table-cell">{patient.gender}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}