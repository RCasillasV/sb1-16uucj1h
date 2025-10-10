import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, UserPlus, Edit, Trash2, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUserManagement } from '../contexts/UserManagementContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  rol: 'Administrador' | 'Medico' | 'Recepcionista';
  estado: 'Activo' | 'Inactivo';
}

const ITEMS_PER_PAGE = 12;

export function Users() {
  const { currentTheme } = useTheme();
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    toggleUserStatus, 
    createUser, 
    updateUser,
    setError 
  } = useUserManagement();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'Recepcionista',
    estado: 'Activo',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          rol: formData.rol,
          estado: formData.estado,
        });
      } else {
        await createUser(formData);
      }

      setShowModal(false);
      setSelectedUser(null);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        rol: 'Recepcionista',
        estado: 'Activo',
      });
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar usuario');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.telefono ?? '').includes(searchTerm)
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

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
              nombre: '',
              email: '',
              telefono: '',
              rol: 'Recepcionista',
              estado: 'Activo',
            });
            setShowModal(true);
          }}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          <UserPlus className="h-5 w-5 mr-5" />
          Agregar
        </button>
      </div>

      <div className="mb-6">
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
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                  Teléfono
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
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
              {loading ? (
                <tr>
                  <td 
                    colSpan={7} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td 
                    colSpan={7} 
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
                      {user.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.rol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{user.estado}</span>
                    </td>            
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({
                            nombre: user.nombre,
                            email: user.email,
                            telefono: user.telefono || '',
                            rol: user.rol,
                            estado: user.estado,
                          });
                          setShowModal(true);
                        }}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors"
                      >
                        <Edit className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                      </button>
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
            nombre: '',
            email: '',
            telefono: '',
            rol: 'Recepcionista',
            estado: 'Activo',
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
                  nombre: '',
                  email: '',
                  telefono: '',
                  rol: 'Recepcionista',
                  estado: 'Activo',
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
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              htmlFor="telefono" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'Administrador' | 'Medico' | 'Recepcionista' })}
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
              <option value="Recepcionista">Recepcionista</option>
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
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'Activo' | 'Inactivo' })}
              required
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}