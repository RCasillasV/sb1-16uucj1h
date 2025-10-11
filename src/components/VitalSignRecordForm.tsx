import React, { useState, useEffect } from 'react';
import { AlertCircle, Save, X } from 'lucide-react';
import type { VitalSignCatalog, VitalSignFormData } from '../types/vitalSigns.types';

interface VitalSignRecordFormProps {
  catalog: VitalSignCatalog[];
  patientId: string;
  patientAge?: number;
  patientSex?: 'M' | 'F';
  appointmentId?: string;
  onSubmit: (data: VitalSignFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<VitalSignFormData>;
}

export const VitalSignRecordForm: React.FC<VitalSignRecordFormProps> = ({
  catalog,
  patientAge,
  patientSex,
  appointmentId,
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<VitalSignFormData>({
    id_signo_vital: initialData?.id_signo_vital || '',
    valor_medido: initialData?.valor_medido || 0,
    fecha_hora: initialData?.fecha_hora || new Date().toISOString().slice(0, 16),
    metodo_usado: initialData?.metodo_usado || '',
    notas: initialData?.notas || '',
    id_cita: appointmentId,
  });

  const [selectedCatalogItem, setSelectedCatalogItem] = useState<VitalSignCatalog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'normal' | 'abnormal' | 'critical' | null>(null);

  const filteredCatalog = catalog.filter((item) => {
    if (!patientAge) return true;

    const ageInMonths = patientAge * 12;
    const ageMatch = ageInMonths >= item.edad_minima && ageInMonths <= item.edad_maxima;
    const sexMatch = item.sexo === 'AMBOS' || item.sexo === patientSex;

    return ageMatch && sexMatch;
  });

  useEffect(() => {
    if (formData.id_signo_vital) {
      const item = catalog.find((c) => c.id === formData.id_signo_vital);
      setSelectedCatalogItem(item || null);

      if (item && formData.valor_medido > 0) {
        validateValue(formData.valor_medido, item);
      }
    }
  }, [formData.id_signo_vital, formData.valor_medido, catalog]);

  const validateValue = (value: number, catalogItem: VitalSignCatalog) => {
    if (
      (catalogItem.valor_critico_bajo !== null && value < catalogItem.valor_critico_bajo) ||
      (catalogItem.valor_critico_alto !== null && value > catalogItem.valor_critico_alto)
    ) {
      setValidationStatus('critical');
    } else if (value < catalogItem.valor_minimo_normal || value > catalogItem.valor_maximo_normal) {
      setValidationStatus('abnormal');
    } else {
      setValidationStatus('normal');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_signo_vital || formData.valor_medido <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Signo Vital *
          </label>
          <select
            value={formData.id_signo_vital}
            onChange={(e) => setFormData({ ...formData, id_signo_vital: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar...</option>
            {filteredCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.Descripcion} ({item.Unidad})
              </option>
            ))}
          </select>
        </div>

        {selectedCatalogItem && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">Rango Normal:</span>
                <p className="text-blue-700">
                  {selectedCatalogItem.valor_minimo_normal} - {selectedCatalogItem.valor_maximo_normal}{' '}
                  {selectedCatalogItem.Unidad}
                </p>
              </div>
              {selectedCatalogItem.valor_critico_bajo !== null && (
                <div>
                  <span className="font-medium text-red-900">Crítico Bajo:</span>
                  <p className="text-red-700">
                    {'< '}
                    {selectedCatalogItem.valor_critico_bajo} {selectedCatalogItem.Unidad}
                  </p>
                </div>
              )}
              {selectedCatalogItem.valor_critico_alto !== null && (
                <div>
                  <span className="font-medium text-red-900">Crítico Alto:</span>
                  <p className="text-red-700">
                    {'> '}
                    {selectedCatalogItem.valor_critico_alto} {selectedCatalogItem.Unidad}
                  </p>
                </div>
              )}
              {selectedCatalogItem.metodo_medicion && (
                <div>
                  <span className="font-medium text-blue-900">Método:</span>
                  <p className="text-blue-700">{selectedCatalogItem.metodo_medicion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Medido * {selectedCatalogItem && `(${selectedCatalogItem.Unidad})`}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.valor_medido || ''}
            onChange={(e) => setFormData({ ...formData, valor_medido: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {validationStatus && formData.valor_medido > 0 && (
            <div
              className={`mt-2 flex items-center gap-2 text-sm ${
                validationStatus === 'critical'
                  ? 'text-red-600'
                  : validationStatus === 'abnormal'
                    ? 'text-yellow-600'
                    : 'text-green-600'
              }`}
            >
              {validationStatus === 'critical' && <AlertCircle className="w-4 h-4" />}
              {validationStatus === 'critical' && <span>⚠️ Valor CRÍTICO</span>}
              {validationStatus === 'abnormal' && <span>⚠ Valor fuera del rango normal</span>}
              {validationStatus === 'normal' && <span>✓ Valor normal</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora *</label>
          <input
            type="datetime-local"
            value={formData.fecha_hora}
            onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Método Usado</label>
          <input
            type="text"
            value={formData.metodo_usado}
            onChange={(e) => setFormData({ ...formData, metodo_usado: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={selectedCatalogItem?.metodo_medicion || 'Ej: Termómetro digital, Esfigmomanómetro...'}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Observaciones adicionales..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.id_signo_vital || formData.valor_medido <= 0}
          className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar Medición'}
        </button>
      </div>
    </form>
  );
};
