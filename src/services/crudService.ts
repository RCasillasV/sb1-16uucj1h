import { supabase } from '../lib/supabase';
import { handle, requireSession, getUserIdbu } from '../lib/supabaseUtils';

export function createService<Table extends string>(table: Table, userIdColumnName: string = 'user_id', includeIdbu: boolean = true) {
  return {
    getAll<R = any>(select: string, fallback: R[] = []) {
      return handle(supabase.from<Table>(table).select<R>(select), fallback);
    },

    getById<R = any>(select: string, id: string, fallback: R | null = null) {
      return handle(
        supabase.from<Table>(table).select<R>(select).eq('id', id).order('id').single(),
        fallback
      );
    },

    async create<R = any>(data: object) {
      const user = await requireSession();

      const insertData: any = { ...data, [userIdColumnName]: user.id };

      if (includeIdbu) {
        // Para tcCitas, usar idBu en lugar de idbu
        if (table === 'tcCitas') {
          const idbuValue = await getIdbu();
          insertData.idBu = idbuValue;
        } else {
          const idbuValue = await getIdbu();
          insertData.idbu = idbuValue;
        }
      }

      return handle(
        supabase
          .from<Table>(table)
          .insert(insertData)
          .select<R>()
          .single(),
        null
      );
    },

    async update<R = any>(id: string, data: object) {
      const user = await requireSession();

      const updateData: any = { ...data, [userIdColumnName]: user.id };

      return handle(
        supabase
          .from<Table>(table)
          .update(updateData)
          .eq('id', id)
          .select<R>()
          .single(),
        null
      );
    },
  };
}