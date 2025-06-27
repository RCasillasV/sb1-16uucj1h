import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, UserPlus, Edit, Trash2, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface User {
  id: string;
  Nombre: string;
  Email: string;
  Estado: 'activo' | 'inactivo';
  Rol: 'Administrador' | 'Medico' | 'Recepcionista';
  idBu: string;
  businessUnit?: {
    Nombre: string;
  };
}

interface FormData {
  Nombre: string;
  Email: string;
  Rol: 'Administrador' | 'Medico' | 'Recepcionista';
  idBu: string;
  Estado: 'activo' | 'inactivo';
}

const ITEMS_PER_PAGE = 10;

export function Users() {
  const { currentTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [businessUnits, setBusinessUnits] = useState<{ id: string; Nombre: string; }[]>([]);
  const [selectedBu, setSelectedBu] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    Nombre: '',
    Email: '',
    Rol: 'Recepcionista',
    idBu: '',
    Estado: 'activo',
  });

  useEffect(() => {
    fetchUsers();
    fetchBusinessUnits();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('tcUsuarios')
        .select('*, businessUnit:tcBu!inner(Nombre)');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('tcBu')
        .select('id, Nombre');

      if (error) throw error;
      setBusinessUnits(data || []);
    } catch (err) {
      console.error('Error fetching business units:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (selectedUser) {
        const { error } = await supabase
          .from('tcUsuarios')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tcUsuarios')
          .insert([{
            ...formData,
            idUsuario: (await supabase.auth.getUser()).data.user?.id
          }]);

        if (error) throw error;
      }

      await fetchUsers();
      setShowModal(false);
      setSelectedUser(null);
      setFormData({
        Nombre: '',
        Email: '',
        Rol: 'Recepcionista',
        idBu: '',
        Estado: 'activo',
      });
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar usuario');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('tcUsuarios')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.Email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedBu || user.idBu === selectedBu)
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Usuarios
          </h1>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setFormData({
              Nombre: '',
              Email: '',
              Rol: 'Recepcionista',
              idBu: '',
              Estado: 'activo',
            });
            setShowModal(true);
          }}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Buscar usuarios..."
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
        <select
          value={selectedBu}
          onChange={(e) => setSelectedBu(e.target.value)}
          className="rounded-md border px-4 py-2"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        >
          <option value="">Todas las unidades</option>
          {businessUnits.map(bu => (
            <option key={bu.id} value={bu.id}>{bu.Nombre}</option>
          ))}
        </select>
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
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Nombre
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Email
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Unidad de Negocio
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Rol
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Estado
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
                    colSpan={6} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td 
                    colSpan={6} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr 
                    key={user.id}
                    style={{ color: currentTheme.colors.text }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.Nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.Email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.businessUnit?.Nombre || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.Rol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          user.Estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        )}
                      >
                        {user.Estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              Nombre: user.Nombre,
                              Email: user.Email,
                              Rol: user.Rol,
                              idBu: user.idBu,
                              Estado: user.Estado,
                            });
                            setShowModal(true);
                          }}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        >
                          <Edit className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
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
            className="px-6 py-3 flex items-center justify-between border-t"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <div>
              <p 
                className="text-sm"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuarios
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
          setSelectedUser(null);
          setFormData({
            Nombre: '',
            Email: '',
            Rol: 'Recepcionista',
            idBu: '',
            Estado: 'activo',
          });
        }}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedUser(null);
                setFormData({
                  Nombre: '',
                  Email: '',
                  Rol: 'Recepcionista',
                  idBu: '',
                  Estado: 'activo',
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
              {selectedUser ? 'Actualizar' : 'Guardar'}
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
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
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
              htmlFor="email" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
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
              htmlFor="rol" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Rol
            </label>
            <select
              id="rol"
              value={formData.Rol}
              onChange={(e) => setFormData({ ...formData, Rol: e.target.value as 'Administrador' | 'Medico' | 'Recepcionista' })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="Administrador">Administrador</option>
              <option value="Medico">Médico</option>
              <option value="Recepcionista">Asistente</option>
            </select>
          </div>

          <div>
            <label 
              htmlFor="idBu" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Unidad de Negocio
            </label>
            <select
              id="idBu"
              value={formData.idBu}
              onChange={(e) => setFormData({ ...formData, idBu: e.target.value })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="">Seleccionar...</option>
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.id}>{bu.Nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label 
              htmlFor="estado" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Estado
            </label>
            <select
              id="estado"
              value={formData.Estado}
              onChange={(e) => setFormData({ ...formData, Estado: e.target.value as 'activo' | 'inactivo' })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
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
        <p>¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}