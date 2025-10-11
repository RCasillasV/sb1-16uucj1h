import React, { useState, useEffect } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Search, Activity } from 'lucide-react';
import { vitalSignsService } from '../services/vitalSignsService';
import { Modal } from '../components/Modal';
import type { VitalSignCatalog } from '../types/vitalSigns.types';

export const VitalSignsCatalog: React.FC = () => {
  const [catalog, setCatalog] = useState<VitalSignCatalog[]>([]);
  const [filteredCatalog, setFilteredCatalog] = useState<VitalSignCatalog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VitalSignCatalog | null>(null);

  const idbu = localStorage.getItem('idbu') || '';

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCatalog(catalog);
    } else {
      const filtered = catalog.filter(
        (item) =>
          item.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.Unidad.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCatalog(filtered);
    }
  }, [searchTerm, catalog]);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const data = await vitalSignsService.getCatalog(idbu);
      setCatalog(data);
      setFilteredCatalog(data);
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (item: VitalSignCatalog) => {
    try {
      await vitalSignsService.updateCatalogItem(item.id, { activo: !item.activo });
      await loadCatalog();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const getAgeRangeText = (minMonths: number, maxMonths: number) => {
    if (maxMonths >= 1200) return `${minMonths / 12} años en adelante`;
    if (minMonths === 0 && maxMonths === 1) return 'Neonato (0-1 mes)';
    if (minMonths < 12) return `${minMonths}-${maxMonths} meses`;
    return `${minMonths / 12}-${maxMonths / 12} años`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Catálogo de Signos Vitales
              </h1>
              <p className="text-gray-600 mt-2">
                Administra los tipos de signos vitales y sus rangos normales
              </p>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nuevo Signo Vital
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por descripción o unidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando catálogo...</p>
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron signos vitales</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
                  item.activo ? 'border-gray-200' : 'border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{item.Descripcion}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {item.Unidad}
                      </span>
                      {!item.activo && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Rango de Edad:</span>
                        <p className="text-gray-900">{getAgeRangeText(item.edad_minima, item.edad_maxima)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Sexo:</span>
                        <p className="text-gray-900">
                          {item.sexo === 'AMBOS' ? 'Ambos' : item.sexo === 'M' ? 'Masculino' : 'Femenino'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Rango Normal:</span>
                        <p className="text-green-700 font-semibold">
                          {item.valor_minimo_normal} - {item.valor_maximo_normal} {item.Unidad}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Valores Críticos:</span>
                        <p className="text-red-700 font-semibold">
                          {item.valor_critico_bajo !== null && `< ${item.valor_critico_bajo}`}
                          {item.valor_critico_bajo !== null && item.valor_critico_alto !== null && ' / '}
                          {item.valor_critico_alto !== null && `> ${item.valor_critico_alto}`}
                          {item.valor_critico_bajo === null && item.valor_critico_alto === null && 'No definidos'}
                        </p>
                      </div>
                    </div>

                    {(item.metodo_medicion || item.frecuencia_registro) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                        {item.metodo_medicion && (
                          <div>
                            <span className="text-sm text-gray-600 font-medium">Método de Medición:</span>
                            <p className="text-gray-900">{item.metodo_medicion}</p>
                          </div>
                        )}
                        {item.frecuencia_registro && (
                          <div>
                            <span className="text-sm text-gray-600 font-medium">Frecuencia de Registro:</span>
                            <p className="text-gray-900">{item.frecuencia_registro}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.activo
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={item.activo ? 'Desactivar' : 'Activar'}
                    >
                      {item.activo ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          title={editingItem ? 'Editar Signo Vital' : 'Nuevo Signo Vital'}
        >
          <p className="text-gray-600 mb-4">
            Funcionalidad de formulario pendiente de implementación
          </p>
        </Modal>
      )}
    </div>
  );
};
