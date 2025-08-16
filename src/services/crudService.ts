import { supabase } from '../lib/supabase';
import { handle, requireSession, requireBusinessUnit } from '../lib/apiHelpers';

export function createService<Table extends string>(table: Table) {
  return {
    getAll<R = any>(select: string, fallback: R[] = []) {
      return handle(supabase.from<Table>(table).select<R>(select), fallback);
    },

    getById<R = any>(select: string, id: string, fallback: R | null = null) {
      return handle(
        supabase.from<Table>(table).select<R>(select).eq('id', id).single(),
        fallback
      );
    },

    async create<R = any>(data: object) {
      const user = await requireSession();
      const idbu = await requireBusinessUnit(user.id);
      return handle(
        supabase
          .from<Table>(table)
          .insert({ ...data, user_id: user.id, idbu })
          .select<R>()
          .single(),
        null
      );
    },

    async update<R = any>(id: string, data: object) {
      const user = await requireSession();
      const idbu = await requireBusinessUnit(user.id);
      return handle(
        supabase
          .from<Table>(table)
          .update({ ...data, user_id: user.id, idbu })
          .eq('id', id)
          .select<R>()
          .single(),
        null
      );
    },
  };
}