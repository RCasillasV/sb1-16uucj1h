import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface Insurance {
  idAs: string;
  Aseguradora: string;
  URL: string | null;
  Contacto: string | null;
  Notas: string | null;
  Activo: boolean;
  idBu: string | null;
}

interface FormData {
  Aseguradora: string;
  URL: string;
  Contacto: string;
  Notas: string;
  Activo: boolean;
}

const ITEMS_PER_PAGE = 10;

export function InsuranceManagement() {
  const { currentTheme } = useTheme();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    Aseguradora: '',
    URL: '',
    Contacto: '',
    Notas: '',
    Activo: true,
  });

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const { data, error } = await supabase
        .from('tcAseguradora')
        .select('*')
        .order('Aseguradora');

      if (error) throw error;
      setInsurances(data || []);
    } catch (err) {
      console.error('Error fetching insurances:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar aseguradoras');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (selectedInsurance) {
        const { error } = await supabase
          .from('tcAseguradora')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('idAs', selectedInsurance.idAs);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tcAseguradora')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchInsurances();
      setShowModal(false);
      setSelectedInsurance(null);
      setFormData({
        Aseguradora: '',
        URL: '',
        Contacto: '',
        Notas: '',
        Activo: true,
      });
    } catch (err) {
      console.error('Error saving insurance:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar aseguradora');
    }
  };

  const handleDelete = async () => {
    if (!selectedInsurance) return;

    try {
      const { error } = await supabase
        .from('tcAseguradora')
        .delete()
        .eq('idAs', selectedInsurance.idAs);

      if (error) throw error;

      await fetchInsurances();
      setShowDeleteModal(false);
      setSelectedInsurance(null);
    } catch (err) {
      console.error('Error deleting insurance:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar aseguradora');
    }
  };

  const filteredInsurances = insurances.filter(insurance =>
    insurance.Aseguradora.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedInsurances = filteredInsurances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredInsurances.length / ITEMS_PER_PAGE);

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-3 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Aseguradoras
          </h1>
        </div>
        <button
          onClick={() => {
            setSelectedInsurance(null);
            setFormData({
              Aseguradora: '',
              URL: '',
              Contacto: '',
              Notas: '',
              Activo: true,
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
            placeholder="Buscar aseguradoras..."
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
                  className="px-3 py-3 text-left text-xs font-large  tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Aseguradora
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-large  tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Contacto
                </th>
                <th 
                  className="px-3 py-3 text-left text-xs font-large   tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Estado
                </th>
                <th 
                  className="px-3 py-3 text-right text-xs font-large   tracking-wider"
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
                    colSpan={4} 
                    className="px-3 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando aseguradoras...
                  </td>
                </tr>
              ) : paginatedInsurances.length === 0 ? (
                <tr>
                  <td 
                    colSpan={4} 
                    className="px-3 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay aseguradoras registradas
                  </td>
                </tr>
              ) : (
                paginatedInsurances.map((insurance) => (
                  <tr 
                    key={insurance.idAs}
                    style={{ color: currentTheme.colors.text }}
                  >
                    <td className="px-2 py-2 whitespace-nowrap">
                      {insurance.Aseguradora}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {insurance.Contacto || '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('tcAseguradora')
                              .update({ Activo: !insurance.Activo })
                              .eq('idAs', insurance.idAs);

                            if (error) throw error;
                            await fetchInsurances();
                          } catch (err) {
                            console.error('Error updating insurance status:', err);
                          }
                        }}
                        className={clsx(
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          insurance.Activo ? 'bg-green-500' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={clsx(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            insurance.Activo ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedInsurance(insurance);
                            setFormData({
                              Aseguradora: insurance.Aseguradora,
                              URL: insurance.URL || '',
                              Contacto: insurance.Contacto || '',
                              Notas: insurance.Notas || '',
                              Activo: insurance.Activo,
                            });
                            setShowModal(true);
                          }}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        >
                          <Edit className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInsurance(insurance);
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
            className="px-3 py-3 flex items-center justify-between border-t"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <div>
              <p 
                className="text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredInsurances.length)} de {filteredInsurances.length} aseguradoras
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
          setSelectedInsurance(null);
          setFormData({
            Aseguradora: '',
            URL: '',
            Contacto: '',
            Notas: '',
            Activo: true,
          });
        }}
        title={selectedInsurance ? 'Editar Aseguradora' : 'Nueva Aseguradora'}
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedInsurance(null);
                setFormData({
                  Aseguradora: '',
                  URL: '',
                  Contacto: '',
                  Notas: '',
                  Activo: true,
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
              {selectedInsurance ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="aseguradora" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Nombre de la Aseguradora
            </label>
            <input
              type="text"
              id="aseguradora"
              value={formData.Aseguradora}
              onChange={(e) => setFormData({ ...formData, Aseguradora: e.target.value })}
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
              htmlFor="url" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              URL
            </label>
            <input
              type="url"
              id="url"
              value={formData.URL}
              onChange={(e) => setFormData({ ...formData, URL: e.target.value })}
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
              htmlFor="contacto" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Contacto
            </label>
            <input
              type="text"
              id="contacto"
              value={formData.Contacto}
              onChange={(e) => setFormData({ ...formData, Contacto: e.target.value })}
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
              htmlFor="notas" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Notas
            </label>
            <textarea
              id="notas"
              value={formData.Notas}
              onChange={(e) => setFormData({ ...formData, Notas: e.target.value })}
              rows={3}
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
              htmlFor="activo" 
              className="text-sm font-medium mr-2"
              style={{ color: currentTheme.colors.text }}
            >
              Activo
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, Activo: !prev.Activo }))}
              className={clsx(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                formData.Activo ? 'bg-green-500' : 'bg-gray-200'
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  formData.Activo ? 'translate-x-5' : 'translate-x-0'
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
          setSelectedInsurance(null);
        }}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedInsurance(null);
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
        <p>¿Está seguro de que desea eliminar esta aseguradora? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}