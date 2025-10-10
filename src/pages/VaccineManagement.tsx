import React, { useState, useEffect } from 'react';
import { Syringe, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/react-query';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface Vaccine {
  id: string;
  created_at?: string;
  updated_at?: string;
  id_user?: string;
  idBu?: string;
  nombre_comercial: string;
  nombre_generico: string;
  abreviatura: string | null;
  fabricante: string | null;
  tipo_inmunizacion: string | null;
  dosis_esquema: number;
  edad_minima_meses: number | null;
  indicaciones: string | null;
  esta_activa: boolean;
}

interface FormData {
  nombre_comercial: string;
  nombre_generico: string;
  abreviatura: string;
  fabricante: string;
  tipo_inmunizacion: string;
  dosis_esquema: number;
  edad_minima_meses: number | null;
  indicaciones: string;
  esta_activa: boolean;
}

const ITEMS_PER_PAGE = 10;

export function VaccineManagement() {
  const { currentTheme } = useTheme();
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nombre_comercial: '',
    nombre_generico: '',
    abreviatura: '',
    fabricante: '',
    tipo_inmunizacion: '',
    dosis_esquema: 1,
    edad_minima_meses: null,
    indicaciones: '',
    esta_activa: true,
  });

  useEffect(() => {
    fetchVaccines();
  }, []);

  // Resetear a página 1 cuando cambie el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchVaccines = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('tcVacunas')
        .select('*')
        .order('nombre_comercial');

      if (error) throw error;
      setVaccines(data || []);
      
    } catch (err) {
      console.error('Error fetching vaccines:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar vacunas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (selectedVaccine) {
        const { error } = await (supabase as any)
          .from('tcVacunas')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedVaccine.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('tcVacunas')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchVaccines();
      setShowModal(false);
      setSelectedVaccine(null);
      setFormData({
        nombre_comercial: '',
        nombre_generico: '',
        abreviatura: '',
        fabricante: '',
        tipo_inmunizacion: '',
        dosis_esquema: 1,
        edad_minima_meses: null,
        indicaciones: '',
        esta_activa: true,
      });
      
      // Invalidar caché para otros componentes que usen vacunas
      queryClient.invalidateQueries({ queryKey: ['activeVaccines'] });
    } catch (err) {
      console.error('Error saving vaccine:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar vacuna');
    }
  };

  const handleDelete = async () => {
    if (!selectedVaccine) return;

    try {
      const { error } = await (supabase as any)
        .from('tcVacunas')
        .delete()
        .eq('id', selectedVaccine.id);

      if (error) throw error;

      await fetchVaccines();
      setShowDeleteModal(false);
      setSelectedVaccine(null);
      
      // Invalidar caché para otros componentes que usen vacunas
      queryClient.invalidateQueries({ queryKey: ['activeVaccines'] });
    } catch (err) {
      console.error('Error deleting vaccine:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar vacuna');
    }
  };

  const filteredVaccines = vaccines.filter(vaccine =>
    vaccine.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vaccine.nombre_generico && vaccine.nombre_generico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedVaccines = filteredVaccines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredVaccines.length / ITEMS_PER_PAGE);

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-3 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Syringe className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Gestión de Vacunas
          </h1>
        </div>
        <button
          onClick={() => {
            setSelectedVaccine(null);
            setFormData({
              nombre_comercial: '',
              nombre_generico: '',
              abreviatura: '',
              fabricante: '',
              tipo_inmunizacion: '',
              dosis_esquema: 1,
              edad_minima_meses: null,
              indicaciones: '',
              esta_activa: true,
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
            placeholder="Buscar por nombre comercial o genérico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-md border-l-4 border-red-500 bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      )}

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
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Nombre Comercial
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Nombre Genérico
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Abreviatura
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Fabricante
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Tipo Inmunización
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Número de Dosis
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Edad Mín. (meses)
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-large tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Estado
                </th>
                <th 
                  className="px-3 py-2 text-right text-xs font-large tracking-wider"
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
                    colSpan={8} 
                    className="px-3 py-2 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando vacunas...
                  </td>
                </tr>
              ) : paginatedVaccines.length === 0 ? (
                <tr>
                  <td 
                    colSpan={8} 
                    className="px-3 py-2 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay vacunas registradas
                  </td>
                </tr>
              ) : (
                paginatedVaccines.map((vaccine) => (
                  <tr 
                    key={vaccine.id}
                    style={{ color: currentTheme.colors.text }}
                  >
                    <td className="px-3 py-3 font-medium">
                      {vaccine.nombre_comercial}
                    </td>
                    <td className="px-3 py-3">
                      {vaccine.nombre_generico || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {vaccine.abreviatura || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {vaccine.fabricante || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {vaccine.tipo_inmunizacion || '-'}
                    </td>
                    <td className="px-3 py-3">
                      {vaccine.dosis_esquema} dosis
                    </td>
                    <td className="px-3 py-3">
                      {vaccine.edad_minima_meses !== null ? `${vaccine.edad_minima_meses} meses` : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await (supabase as any)
                              .from('tcVacunas')
                              .update({ esta_activa: !vaccine.esta_activa })
                              .eq('id', vaccine.id);

                            if (error) throw error;
                            await fetchVaccines();
                            
                            // Invalidar caché para otros componentes que usen vacunas
                            queryClient.invalidateQueries({ queryKey: ['activeVaccines'] });
                          } catch (err) {
                            console.error('Error updating vaccine status:', err);
                          }
                        }}
                        className={clsx(
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          vaccine.esta_activa ? 'bg-green-500' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={clsx(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            vaccine.esta_activa ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedVaccine(vaccine);
                            setFormData({
                              nombre_comercial: vaccine.nombre_comercial,
                              nombre_generico: vaccine.nombre_generico || '',
                              abreviatura: vaccine.abreviatura || '',
                              fabricante: vaccine.fabricante || '',
                              tipo_inmunizacion: vaccine.tipo_inmunizacion || '',
                              dosis_esquema: vaccine.dosis_esquema || 1,
                              edad_minima_meses: vaccine.edad_minima_meses,
                              indicaciones: vaccine.indicaciones || '',
                              esta_activa: vaccine.esta_activa,
                            });
                            setShowModal(true);
                          }}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        >
                          <Edit className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVaccine(vaccine);
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
            className="px-3 py-2 flex items-center justify-between border-t"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <div>
              <p 
                className="text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredVaccines.length)} de {filteredVaccines.length} vacunas
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
          setSelectedVaccine(null);
          setFormData({
            nombre_comercial: '',
            nombre_generico: '',
            abreviatura: '',
            fabricante: '',
            tipo_inmunizacion: '',
            dosis_esquema: 1,
            edad_minima_meses: null,
            indicaciones: '',
            esta_activa: true,
          });
        }}
        title={selectedVaccine ? 'Editar Vacuna' : 'Nueva Vacuna'}
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedVaccine(null);
                setFormData({
                  nombre_comercial: '',
                  nombre_generico: '',
                  abreviatura: '',
                  fabricante: '',
                  tipo_inmunizacion: '',
                  dosis_esquema: 1,
                  edad_minima_meses: null,
                  indicaciones: '',
                  esta_activa: true,
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
              {selectedVaccine ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="nombre_comercial" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Nombre Comercial *
              </label>
              <input
                type="text"
                id="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                required
                maxLength={150}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="nombre_generico" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Nombre Genérico
              </label>
              <input
                type="text"
                id="nombre_generico"
                value={formData.nombre_generico}
                onChange={(e) => setFormData({ ...formData, nombre_generico: e.target.value })}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="abreviatura" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Abreviatura
              </label>
              <input
                type="text"
                id="abreviatura"
                value={formData.abreviatura}
                onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="fabricante" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Fabricante
              </label>
              <input
                type="text"
                id="fabricante"
                value={formData.fabricante}
                onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="tipo_inmunizacion" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Tipo de Inmunización
              </label>
              <select
                id="tipo_inmunizacion"
                value={formData.tipo_inmunizacion}
                onChange={(e) => setFormData({ ...formData, tipo_inmunizacion: e.target.value })}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                <option value="">Seleccionar tipo</option>
                <option value="Viral">Viral</option>
                <option value="Bacteriana">Bacteriana</option>
                <option value="Toxoide">Toxoide</option>
                <option value="Inactivada">Inactivada</option>
                <option value="Atenuada">Atenuada</option>
                <option value="Subunidad">Subunidad</option>
                <option value="Conjugada">Conjugada</option>
                <option value="Recombinante">Recombinante</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="edad_minima_meses" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Edad Mínima (meses)
              </label>
              <input
                type="number"
                id="edad_minima_meses"
                min="0"
                max="240"
                value={formData.edad_minima_meses || ''}
                onChange={(e) => setFormData({ ...formData, edad_minima_meses: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="dosis_esquema" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Número de Dosis *
            </label>
            <input
              type="number"
              id="dosis_esquema"
              min="1"
              max="10"
              value={formData.dosis_esquema}
              onChange={(e) => setFormData({ ...formData, dosis_esquema: parseInt(e.target.value) || 1 })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>

          <div>
            <label 
              htmlFor="indicaciones" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Indicaciones
            </label>
            <textarea
              id="indicaciones"
              value={formData.indicaciones}
              onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
              rows={3}
              placeholder="Indicaciones médicas, contraindicaciones, etc."
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>

          <div className="flex items-center">
            <label 
              htmlFor="esta_activa" 
              className="text-sm font-medium mr-2"
              style={{ color: currentTheme.colors.text }}
            >
              Activa
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, esta_activa: !prev.esta_activa }))}
              className={clsx(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                formData.esta_activa ? 'bg-green-500' : 'bg-gray-200'
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  formData.esta_activa ? 'translate-x-5' : 'translate-x-0'
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
          setSelectedVaccine(null);
        }}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedVaccine(null);
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
        <div>
          <p style={{ color: currentTheme.colors.text }}>
            ¿Está seguro de que desea eliminar la vacuna <strong>{selectedVaccine?.nombre_comercial}</strong>?
          </p>
          <p style={{ color: currentTheme.colors.textSecondary }} className="text-sm mt-2">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
}