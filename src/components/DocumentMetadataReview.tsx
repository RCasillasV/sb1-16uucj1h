import React, { useState, useEffect } from 'react';
import { DatosExtraidos, TipoEstudio } from '../types/documentos-medicos';
import { useTheme } from '../contexts/ThemeContext';
import { Check, X, Edit2, Save, AlertTriangle, FileText, Calendar, User, Building, Hash } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { Modal } from './Modal';
import clsx from 'clsx';

interface DocumentMetadataReviewProps {
  datos: DatosExtraidos;
  onSave: (datosEditados: DatosExtraidos) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DocumentMetadataReview({ 
  datos, 
  onSave, 
  onCancel, 
  isLoading = false 
}: DocumentMetadataReviewProps) {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const [editedData, setEditedData] = useState<DatosExtraidos>(datos);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Pre-llenar nombre del paciente si está vacío
  useEffect(() => {
    if (selectedPatient && (!editedData.paciente?.nombre || editedData.paciente.nombre.trim() === '')) {
      const nombreCompleto = `${selectedPatient.Nombre} ${selectedPatient.Paterno || ''} ${selectedPatient.Materno || ''}`.trim();
      setEditedData(prev => ({
        ...prev,
        paciente: {
          ...prev.paciente,
          nombre: nombreCompleto
        }
      }));
    }
  }, [selectedPatient]);

  // Detectar cambios en los datos
  useEffect(() => {
    const dataChanged = JSON.stringify(editedData) !== JSON.stringify(datos);
    setHasChanges(dataChanged);
  }, [editedData, datos]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedData);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      // Si hay cambios, mostrar confirmación
      setShowCloseConfirm(true);
    } else {
      // Si no hay cambios, cerrar directamente
      onCancel();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onCancel();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  const updateField = (field: keyof DatosExtraidos, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const updatePaciente = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      paciente: { ...prev.paciente, [field]: value }
    }));
  };

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors flex items-center gap-2',
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md'
    ),
  };

  const getConfianzaColor = (confianza: number) => {
    if (confianza >= 80) return '#10B981'; // Verde
    if (confianza >= 60) return '#F59E0B'; // Amarillo
    return '#EF4444'; // Rojo
  };

  return (
    <div 
      className="rounded-lg shadow-lg p-6 max-w-7xl mx-auto w-full"
      style={{ 
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border 
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h2 
            className="text-xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Revisar Datos Extraídos
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              background: `${getConfianzaColor(editedData.confianza)}20`,
              color: getConfianzaColor(editedData.confianza)
            }}
          >
            Confianza: {editedData.confianza}%
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Cerrar"
          >
            <X className="h-5 w-5" style={{ color: currentTheme.colors.text }} />
          </button>
        </div>
      </div>

      {/* Alerta si confianza es baja */}
      {editedData.confianza < 70 && (
        <div 
          className="mb-4 p-3 rounded-lg flex items-start gap-3"
          style={{ 
            background: '#FEF3C7',
            borderLeft: '4px solid #F59E0B'
          }}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: '#F59E0B' }} />
          <p className="text-sm" style={{ color: '#92400E' }}>
            La confianza en la extracción es baja. Por favor, revise cuidadosamente todos los campos.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Tipo de Estudio */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Tipo de Estudio
          </label>
          <select
            value={editedData.tipo_estudio}
            onChange={(e) => updateField('tipo_estudio', e.target.value as TipoEstudio)}
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border
            }}
          >
            <option value="laboratorio">Laboratorio</option>
            <option value="radiografia">Radiografía</option>
            <option value="ultrasonido">Ultrasonido</option>
            <option value="tomografia">Tomografía</option>
            <option value="resonancia">Resonancia Magnética</option>
            <option value="electrocardiograma">Electrocardiograma</option>
            <option value="endoscopia">Endoscopia</option>
            <option value="biopsia">Biopsia</option>
            <option value="patologia">Patología</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Datos del Paciente */}
        <div 
          className="p-4 rounded-lg space-y-4"
          style={{ background: currentTheme.colors.background }}
        >
          {/* Nombre del Paciente - Ocupa todo el ancho */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
              <User className="inline h-4 w-4 mr-1" />
              Nombre del Paciente
            </label>
            <input
              type="text"
              value={editedData.paciente?.nombre || ''}
              onChange={(e) => updatePaciente('nombre', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-lg font-medium"
              placeholder="Nombre del paciente"
              style={{ 
                background: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border
              }}
            />
          </div>

          {/* Otros campos en grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
                Edad
              </label>
              <input
                type="number"
                value={editedData.paciente.edad || ''}
                onChange={(e) => updatePaciente('edad', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
                Sexo
              </label>
              <select
                value={editedData.paciente.sexo || ''}
                onChange={(e) => updatePaciente('sexo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }}
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información del Estudio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
              <Calendar className="inline h-4 w-4 mr-1" />
              Fecha del Estudio
            </label>
            <input
              type="date"
              value={editedData.fecha_estudio}
              onChange={(e) => updateField('fecha_estudio', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                background: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
              <Hash className="inline h-4 w-4 mr-1" />
              Número de Estudio
            </label>
            <input
              type="text"
              value={editedData.numero_estudio || ''}
              onChange={(e) => updateField('numero_estudio', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                background: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
              Médico Solicitante
            </label>
            <input
              type="text"
              value={editedData.medico_solicitante || ''}
              onChange={(e) => updateField('medico_solicitante', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                background: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
              <Building className="inline h-4 w-4 mr-1" />
              Institución
            </label>
            <input
              type="text"
              value={editedData.institucion || ''}
              onChange={(e) => updateField('institucion', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                background: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border
              }}
            />
          </div>
        </div>

        {/* Impresión Diagnóstica */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Impresión Diagnóstica
          </label>
          <textarea
            value={editedData.impresion_diagnostica}
            onChange={(e) => updateField('impresion_diagnostica', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border
            }}
          />
        </div>

        {/* Hallazgos */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Hallazgos Principales
          </label>
          <textarea
            value={editedData.hallazgos.join('\n')}
            onChange={(e) => updateField('hallazgos', e.target.value.split('\n').filter(h => h.trim()))}
            rows={4}
            placeholder="Un hallazgo por línea"
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border
            }}
          />
        </div>

        {/* Recomendaciones */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Recomendaciones
          </label>
          <textarea
            value={editedData.recomendaciones || ''}
            onChange={(e) => updateField('recomendaciones', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border"
            style={{
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border
            }}
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: currentTheme.colors.border }}>
        <button
          onClick={onCancel}
          disabled={saving}
          className={buttonStyle.base}
          style={{
            background: currentTheme.colors.surface,
            color: currentTheme.colors.text,
            border: `1px solid ${currentTheme.colors.border}`
          }}
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={buttonStyle.base}
          style={{
            background: currentTheme.colors.primary,
            color: 'white'
          }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Confirmar y Guardar
            </>
          )}
        </button>
      </div>

      {/* Modal de confirmación para cerrar sin guardar */}
      <Modal
        isOpen={showCloseConfirm}
        onClose={cancelClose}
        title="¿Cerrar sin guardar?"
        actions={
          <div className="flex gap-3">
            <button
              onClick={cancelClose}
              className={clsx(buttonStyle.base)}
              style={{
                background: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                border: `1px solid ${currentTheme.colors.border}`
              }}
            >
              Continuar editando
            </button>
            <button
              onClick={confirmClose}
              className={clsx(buttonStyle.base)}
              style={{
                background: '#DC2626',
                color: 'white'
              }}
            >
              Cerrar sin guardar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p style={{ color: currentTheme.colors.text }}>
            Tienes cambios sin guardar. Si cierras ahora, se perderán todos los cambios realizados.
          </p>
          <p style={{ color: currentTheme.colors.text }} className="font-medium">
            ¿Estás seguro de que deseas cerrar sin guardar?
          </p>
        </div>
      </Modal>
    </div>
  );
}