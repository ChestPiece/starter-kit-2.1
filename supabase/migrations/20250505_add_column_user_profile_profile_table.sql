DO $$ 
BEGIN
    -- Check if the migration '20250505_add_column_user_profile_profile_table.sql' has already been executed successfully
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250505_add_column_user_profile_profile_table.sql'
        AND status = 'success'
    ) THEN

        ALTER TABLE public.user_profile ADD COLUMN profile TEXT;

       
  -- Log the successful migration
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250505_add_column_user_profile_profile_table.sql', 'success', 'user_profile table migration ran successfully.');
    END IF;
END $$; 