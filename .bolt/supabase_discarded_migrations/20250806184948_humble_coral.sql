```sql
-- supabase/migrations/rename_agenda_tables.sql

-- Rename agenda_settings to tcAgendaSettings
ALTER TABLE public.agenda_settings RENAME TO tcAgendaSettings;

-- Rename blocked_dates to tcAgendaBloqueada
ALTER TABLE public.blocked_dates RENAME TO tcAgendaBloqueada;

-- Update foreign key constraints if any exist and refer to these tables
-- (This step might require more specific SQL depending on your exact FKs.
-- The system will usually handle simple renames, but complex ones might need manual adjustment.)

-- Example of updating a foreign key if it explicitly referenced the old table name:
-- ALTER TABLE public.some_other_table RENAME CONSTRAINT some_fk_constraint TO new_fk_constraint_name;
-- ALTER TABLE public.some_other_table ADD CONSTRAINT new_fk_constraint_name FOREIGN KEY (column_name) REFERENCES public.tcAgendaSettings(id);
```