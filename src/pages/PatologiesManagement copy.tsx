import React, { useState, useEffect } from 'react';
import { Stethoscope, Search, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { queryClient } from '../lib/react-query';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface Patology {
  id: string;
  nombre: string;
  codcie10: string | null;
  especialidad: string | null;
  sexo: string | null;
  activo: boolean;
  created_at: string;
}

interface Specialty {
  'No.': number;
  Especialidad: string;
}

interface FormData {
  nombre: string;
  codcie10: string;
  especialidad: string;
  sexo: string;
  activo: boolean;
}

const ITEMS_PER_PAGE = 12;

export function PatologiesManagement() {
  const { currentTheme } = useTheme();
  const [patologies, setPatologies] = useState<Patology[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatology, setSelectedPatology] = useState<Patology | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    codcie10: '',
    especialidad: 'Medicina General',
    sexo: 'Indistinto',
    activo: true,
  });

  useEffect(() => {
    fetchPatologies();
    fetchSpecialties();
  }, []);

  const fetchPatologies = async () => {
    try {
      const { data, error } = await supabase
        .from('tcPatologias')
        .select('*')
        .order('activo', { ascending: false })
        .order('nombre');

      if (error) throw error;
      setPatologies(data || []);
    } catch (err) {
      console.error('Error fetching patologies:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar patologías');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('tcEspecialidad')
        .select('*')
        .order('Especialidad');

      if (error) throw error;
      setSpecialties(data || []);
    } catch (err) {
      console.error('Error fetching specialties:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (selectedPatology) {
        const { error } = await supabase
          .from('tcPatologias')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPatology.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tcPatologias')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchPatologies();
      setShowModal(false);
      setSelectedPatology(null);
      setFormData({
        nombre: '',
        codcie10: '',
        // @ts-ignore
        especialidad: 'Medicina General',
        sexo: 'Indistinto',
        activo: true,
      });
      queryClient.invalidateQueries({ queryKey: ['activePatologies'] }); // Invalida la caché de patologías activas
    } catch (err) {
      console.error('Error saving patology:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar patología');
    }
  };

  const handleDelete = async () => {
    if (!selectedPatology) return;

    try {
      const { error } = await supabase
        .from('tcPatologias')
        .delete()
        .eq('id', selectedPatology.id);

      if (error) throw error;

      await fetchPatologies();
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['activePatologies'] }); // Invalida la caché de patologías activas
      setSelectedPatology(null);
    } catch (err) {
      console.error('Error deleting patology:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar patología');
    }
  };

  const filteredPatologies = patologies.filter(patology =>
    patology.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patology.codcie10 && patology.codcie10.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patology.especialidad && patology.especialidad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedPatologies = filteredPatologies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredPatologies.length / ITEMS_PER_PAGE);

  const buttonStyle = {
    base: clsx(
      'px-4 py-1 transition-colors',
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons?.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors?.buttonPrimary || currentTheme.colors.primary,
      color: currentTheme.colors.buttonText,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Catálogo de Patologías
          </h1>
        </div>
        <button
          onClick={() => {
            setSelectedPatology(null);
            setFormData({
              nombre: '',
              codcie10: '',
              especialidad: 'Medicina General',
              sexo: 'Indistinto',
              activo: true,
            });
            setShowModal(true);
          }}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Buscar patologías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>
      </div>

      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: currentTheme.colors.border }}>
            <thead>
              <tr style={{ background: currentTheme.colors.background }}>
                <th 
                  className="px-6 py-1 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Nombre
                </th>
                <th 
                  className="px-6 py-1 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Especialidad
                </th>
                <th 
                  className="px-6 py-1 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Sexo
                </th>
                <th 
                  className="px-6 py-1 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Estado
                </th>
                <th 
                  className="px-6 py-1 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
              {loading ? (
                <tr>
                  <td 
                    colSpan={6} 
                    className="px-6 py-1 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando patologías...
                  </td>
                </tr>
              ) : paginatedPatologies.length === 0 ? (
                <tr>
                  <td 
                    colSpan={6} 
                    className="px-6 py-1 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay patologías registradas
                  </td>
                </tr>
              ) : (
                paginatedPatologies.map((patology) => (
                  <tr 
                    key={patology.id}
                    style={{ color: currentTheme.colors.text }}
                  >
                    <td className="px-6 py-1 whitespace-nowrap truncate">
                      {patology.nombre}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap truncate">
                      {patology.especialidad || '-'}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap truncate">
                      {patology.sexo || 'Indistinto'}
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap truncate">
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('tcPatologias')
                              .update({ activo: !patology.activo })
                              .eq('id', patology.id);

                            if (error) throw error;
                            queryClient.invalidateQueries({ queryKey: ['activePatologies'] }); // Invalida la caché de patologías activas
                            await fetchPatologies();
                          } catch (err) {
                            console.error('Error updating patology status:', err);
                          }
                        }}
                        className={clsx(
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          patology.activo ? 'bg-green-500' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={clsx(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            patology.activo ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-1 whitespace-nowrap truncate text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPatology(patology);
                            setFormData({
                              nombre: patology.nombre,
                              codcie10: patology.codcie10 || '',
                              especialidad: patology.especialidad || 'Medicina General',
                              sexo: patology.sexo || 'Indistinto',
                              activo: patology.activo,
                            });
                            setShowModal(true);
                          }}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        >
                          <Edit className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatology(patology);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div 
            className="px-6 py-1 flex items-center justify-between border-t"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <div>
              <p 
                className="text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatologies.length)} de {filteredPatologies.length} patologías
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={clsx(
                  'px-3 py-1 rounded-md transition-colors',
                  currentPage === 1 && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={clsx(
                  'px-3 py-1 rounded-md transition-colors',
                  currentPage === totalPages && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPatology(null);
          setFormData({
            nombre: '',
            codcie10: '',
            especialidad: 'Medicina General',
            sexo: 'Indistinto',
            activo: true,
          });
        }}
        title={selectedPatology ? 'Editar Patología' : 'Nueva Patología'}
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedPatology(null);
                setFormData({
                  nombre: '',
                  codcie10: '',
                  especialidad: 'Medicina General',
                  sexo: 'Indistinto',
                  activo: true,
                });
              }}
              className={clsx(buttonStyle.base, 'border')}
              style={{
                background: 'transparent',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className={buttonStyle.base}
              style={buttonStyle.primary}
            >
              {selectedPatology ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="nombre" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Nombre de la Patología *
            </label>
            <input
              type="text"
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
              placeholder="Ej: Hipertensión arterial"
            />
          </div>
          <div>
            <label 
              htmlFor="especialidad" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Especialidad
            </label>
            <select
              id="especialidad"
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="Medicina General">Medicina General</option>
              {specialties.map((specialty) => (
                <option key={specialty['No.']} value={specialty.Especialidad}>
                  {specialty.Especialidad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label 
              htmlFor="sexo" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Sexo
            </label>
            <select
              id="sexo"
              value={formData.sexo}
              onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="Indistinto">Indistinto</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>

          <div className="flex items-center">
            <label 
              htmlFor="activo" 
              className="text-sm font-medium mr-2"
              style={{ color: currentTheme.colors.text }}
            >
              Activo
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
              className={clsx(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                formData.activo ? 'bg-green-500' : 'bg-gray-200'
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  formData.activo ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPatology(null);
        }}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedPatology(null);
              }}
              className={clsx(buttonStyle.base, 'border')}
              style={{
                background: 'transparent',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className={buttonStyle.base}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
              }}
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p>¿Está seguro de que desea eliminar esta patología? Esta acción no se puede deshacer.</p>
      </Modal>

      {error && (
        <div 
          className="mt-4 p-4 rounded-md border-l-4"
          style={{
            background: '#FEE2E2',
            borderLeftColor: '#DC2626',
            color: '#DC2626',
          }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}