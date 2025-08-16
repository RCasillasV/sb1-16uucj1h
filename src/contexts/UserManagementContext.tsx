import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  estado: 'Activo' | 'Inactivo';
  rol: 'Administrador' | 'Medico' | 'Recepcionista';
  fechaultimoacceso: string | null;
}

interface UserManagementContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  toggleUserStatus: (user: User) => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'fechaultimoacceso'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  setError: (error: string | null) => void;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('tcUsuarios')
        .select('id, nombre, email, telefono, estado, rol, fechaultimoacceso');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
    return () => {
      unsubscribe();
    };
  }, []);

  const toggleUserStatus = useCallback(async (user: User) => {
    setError(null);
    try {
      const newStatus = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
      
      // Primero intentamos con la API centralizada si existe
      // Si no, usamos la llamada directa a Supabase
      const { error } = await supabase
        .from('tcUsuarios')
        .update({ 
          estado: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        // Si falla, intentamos con una función RPC que tenga permisos de SECURITY DEFINER
        const { error: rpcError } = await supabase.rpc('update_user_status', {
          user_id: user.id,
          new_status: newStatus
        });
        
        if (rpcError) throw rpcError;
      }

      // Actualizar el estado local inmediatamente para una mejor UX
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === user.id ? { ...u, estado: newStatus } : u
        )
      );

      // Refrescar desde la base de datos para asegurar consistencia
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado del usuario');
      
      // Si hay error, revertir el cambio local
      await fetchUsers();
    }
  }, [fetchUsers]);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'fechaultimoacceso'>) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('tcUsuarios')
        .insert([userData]);

      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
      throw err;
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('tcUsuarios')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
      throw err;
    }
  }, [fetchUsers]);

  const value = {
    users,
    loading,
    error,
    fetchUsers,
    toggleUserStatus,
    createUser,
    updateUser,
    setError,
  };

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  );
}

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
};