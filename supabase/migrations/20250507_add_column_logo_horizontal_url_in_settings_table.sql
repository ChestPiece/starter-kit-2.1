DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250507_add_column_logo_horizontal_url_in_settings_table.sql'
        AND status = 'success'
    ) THEN

        ALTER TABLE public.settings ADD COLUMN logo_horizontal_url TEXT;

       
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250507_add_column_logo_horizontal_url_in_settings_table.sql', 'success', 'logo_horizontal_url table migration ran successfully.');
    END IF;
END $$; 