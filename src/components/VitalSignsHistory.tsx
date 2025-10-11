import React, { useState } from 'react';
import { Trash2, AlertCircle, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { VitalSignRecord } from '../types/vitalSigns.types';

interface VitalSignsHistoryProps {
  records: VitalSignRecord[];
  onDelete?: (id: string) => Promise<void>;
  showPatientInfo?: boolean;
}

export const VitalSignsHistory: React.FC<VitalSignsHistoryProps> = ({
  records,
  onDelete,
  showPatientInfo = false,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getValueStatusClass = (record: VitalSignRecord) => {
    if (!record.tcSignosVitales) return '';

    const catalog = record.tcSignosVitales;
    const value = record.valor_medido;

    if (record.es_critico) {
      return 'bg-red-50 border-red-200 text-red-900';
    }

    if (value < catalog.valor_minimo_normal || value > catalog.valor_maximo_normal) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    }

    return 'bg-green-50 border-green-200 text-green-900';
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hay registros de signos vitales</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div
          key={record.id}
          className={`border rounded-lg p-4 transition-all ${getValueStatusClass(record)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">
                  {record.tcSignosVitales?.Descripcion || 'Signo Vital'}
                </h3>
                {record.es_critico && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    CRÍTICO
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="text-sm font-medium opacity-75">Valor Medido:</span>
                  <p className="text-xl font-bold">
                    {record.valor_medido} {record.tcSignosVitales?.Unidad}
                  </p>
                </div>

                {record.tcSignosVitales && (
                  <div>
                    <span className="text-sm font-medium opacity-75">Rango Normal:</span>
                    <p className="text-sm">
                      {record.tcSignosVitales.valor_minimo_normal} -{' '}
                      {record.tcSignosVitales.valor_maximo_normal} {record.tcSignosVitales.Unidad}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium opacity-75 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Fecha y Hora:
                  </span>
                  <p className="text-sm">
                    {format(new Date(record.fecha_hora), "dd/MMM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              {record.metodo_usado && (
                <div className="mb-2">
                  <span className="text-sm font-medium opacity-75">Método:</span>
                  <p className="text-sm">{record.metodo_usado}</p>
                </div>
              )}

              {record.notas && (
                <div className="mb-2">
                  <span className="text-sm font-medium opacity-75">Notas:</span>
                  <p className="text-sm">{record.notas}</p>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs opacity-60 mt-2">
                <User className="w-3 h-3" />
                <span>Registrado el {format(new Date(record.created_at), "dd/MMM/yyyy HH:mm", { locale: es })}</span>
              </div>
            </div>

            {onDelete && (
              <button
                onClick={() => handleDelete(record.id)}
                disabled={deletingId === record.id}
                className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                title="Eliminar registro"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
