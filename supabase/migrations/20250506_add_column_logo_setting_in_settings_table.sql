DO $$ 
BEGIN
    -- Check if the migration '20250506_add_column_logo_setting_in_settings_table.sql' has already been executed successfully
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250506_add_column_logo_setting_in_settings_table.sql'
        AND status = 'success'
    ) THEN

        ALTER TABLE public.settings ADD COLUMN logo_setting TEXT;

       
  -- Log the successful migration
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250506_add_column_logo_setting_in_settings_table.sql', 'success', 'logo_setting table migration ran successfully.');
    END IF;
END $$; 