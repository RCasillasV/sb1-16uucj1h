import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal } from '../../components/Modal';
import clsx from 'clsx';

interface BusinessUnit {
  idBu: string;
  Nombre: string;
  Descripcion: string;
  Calle: string | null;
  Colonia: string | null;
  Ciudad: string | null;
  Estado: string | null;
  CP: number | null;
  RFC: string | null;
  dtVigencia: number | null;
}

interface FormData {
  idBu: string;
  Nombre: string;  
  Descripcion: string;
  Calle: string;
  Colonia: string;
  Ciudad: string;
  Estado: string;
  CP: string;
  RFC: string;
}

const initialFormData: FormData = {
  Nombre: '',
  Descripcion: '',
  Calle: '',
  Colonia: '',
  Ciudad: '',
  Estado: '',
  CP: '',
  RFC: '',
};

export function BusinessUnits() {
  const { currentTheme } = useTheme();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('tcBu')
        .select('idBu, Nombre, Descripcion, Calle, Colonia, Ciudad, Estado, CP, RFC, dtVigencia, Especialidad')
        .order('Nombre');

      if (error) throw error;
      setBusinessUnits(data || []);
    } catch (err) {
      console.error('Error fetching business units:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las unidades de negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...formData,
        CP: formData.CP ? parseInt(formData.CP) : null,
      };

      if (selectedUnit) {
        const { error } = await supabase
          .from('tcBu')
          .update(payload)
          .eq('idBu', selectedUnit.idBu);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tcBu')
          .insert([payload]);

        if (error) throw error;
      }

      await fetchBusinessUnits();
      setShowModal(false);
      setSelectedUnit(null);
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error saving business unit:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la unidad de negocio');
    }
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;

    try {
      const { error } = await supabase
        .from('tcBu')
        .delete()
        .eq('idBu', selectedUnit.idBu);

      if (error) throw error;

      await fetchBusinessUnits();
      setShowDeleteModal(false);
      setSelectedUnit(null);
    } catch (err) {
      console.error('Error deleting business unit:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la unidad de negocio');
    }
  };

  const handleEdit = (unit: BusinessUnit) => {
    setSelectedUnit(unit);
    setFormData({
      idBu:unit.idBu,
      Nombre: unit.Nombre,
      Descripcion: unit.Descripcion,
      Calle: unit.Calle || '',
      Colonia: unit.Colonia || '',
      Ciudad: unit.Ciudad || '',
      Estado: unit.Estado || '',
      CP: unit.CP?.toString() || '',
      RFC: unit.RFC || '',
    });
    setShowModal(true);
  };

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
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ 
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamily,
            }}
          >
            Unidad de Negocio
          </h1>
        </div>
      </div>

      {error && (
        <div 
          className="mb-4 p-4 rounded-md"
          style={{
            background:  currentTheme.colors.surface,
            color: '#DC2626',
          }}
        >
          {error}
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
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Nombre
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Dirección
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Ciudad
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  RFC
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
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
                    colSpan={5} 
                    className="px-3 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando unidad de negocio...
                  </td>
                </tr>
              ) : businessUnits.length === 0 ? (
                <tr>
                  <td 
                    colSpan={5} 
                    className="px-3 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay unidad de negocio registradas
                  </td>
                </tr>
              ) : (
                businessUnits.map((unit) => (
                  <tr 
                    key={unit.idBu}
                    style={{ color: currentTheme.colors.text }}
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      {unit.Nombre}
                    </td> 
                    <td className="px-3 py-4 whitespace-nowrap">
                      {unit.Calle && unit.Colonia ? `${unit.Calle}, ${unit.Colonia}` : unit.Calle || unit.Colonia || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {unit.Ciudad && unit.Estado ? `${unit.Ciudad}, ${unit.Estado}` : unit.Ciudad || unit.Estado || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {unit.RFC || '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUnit(null);
          setFormData(initialFormData);
        }}
        title={selectedUnit ? 'Editar Unidad de Negocio' : 'Nueva Unidad de Negocio'}
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedUnit(null);
                setFormData(initialFormData);
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
              {selectedUnit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label 
              htmlFor="descripcion" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Nombre
            </label>
            <input
              type="text"
              id="Nombre"
              value={formData.Nombre}
              onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
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
              htmlFor="descripcion" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Descripción
            </label>
            <input
              type="text"
              id="descripcion"
              value={formData.Descripcion}
              onChange={(e) => setFormData({ ...formData, Descripcion: e.target.value })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="calle" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Calle
              </label>
              <input
                type="text"
                id="calle"
                value={formData.Calle}
                onChange={(e) => setFormData({ ...formData, Calle: e.target.value })}
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
                htmlFor="colonia" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Colonia
              </label>
              <input
                type="text"
                id="colonia"
                value={formData.Colonia}
                onChange={(e) => setFormData({ ...formData, Colonia: e.target.value })}
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
                htmlFor="ciudad" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Ciudad
              </label>
              <input
                type="text"
                id="ciudad"
                value={formData.Ciudad}
                onChange={(e) => setFormData({ ...formData, Ciudad: e.target.value })}
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
                htmlFor="estado" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Estado
              </label>
              <input
                type="text"
                id="estado"
                value={formData.Estado}
                onChange={(e) => setFormData({ ...formData, Estado: e.target.value })}
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
                htmlFor="cp" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Código Postal
              </label>
              <input
                type="text"
                id="cp"
                value={formData.CP}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setFormData({ ...formData, CP: value });
                }}
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
                htmlFor="rfc" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                RFC
              </label>
              <input
                type="text"
                id="rfc"
                value={formData.RFC}
                onChange={(e) => setFormData({ ...formData, RFC: e.target.value })}
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
           <div className="col-span-2 mb-6">
            <label 
              htmlFor="idBu" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              id Unidad de Negocio
             </label>
             <div
               className="w-full p-3 rounded-md border bg-gray-50 font-bold text-center"
               style={{
                 background: `${currentTheme.colors.background}80`,
                 borderColor: currentTheme.colors.border,
                 color: currentTheme.colors.textSecondary,
               }}
             >
               {formData.idBu}
             </div>   
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUnit(null);
        }}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUnit(null);
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
        <p>¿Está seguro de que desea eliminar esta unidad de negocio? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}