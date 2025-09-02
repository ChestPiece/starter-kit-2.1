DO $$ 
BEGIN
    -- Check if the migration '20250115_add_settings_rls_policies.sql' has already been executed successfully
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250115_add_settings_rls_policies.sql'
        AND status = 'success'
    ) THEN

        -- Drop existing policies if they exist (in case of re-run)
        DROP POLICY IF EXISTS "Allow public read access to settings" ON public.settings;
        DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON public.settings;
        DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON public.settings;

        -- Create RLS policies for settings table
        -- Allow anyone to read settings (public access)
        CREATE POLICY "Allow public read access to settings" ON public.settings
            FOR SELECT USING (true);

        -- Allow authenticated users to insert settings (for initial setup)
        CREATE POLICY "Allow authenticated users to insert settings" ON public.settings
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

        -- Allow authenticated users to update settings
        CREATE POLICY "Allow authenticated users to update settings" ON public.settings
            FOR UPDATE USING (auth.uid() IS NOT NULL);

        -- Allow authenticated users to delete settings (optional, for admin users only)
        -- CREATE POLICY "Allow admins to delete settings" ON public.settings
        --     FOR DELETE USING (
        --         EXISTS (
        --             SELECT 1 FROM public.user_profile 
        --             WHERE user_profile.id = auth.uid() 
        --             AND user_profile.role_id = 'a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4'
        --         )
        --     );

        -- Log the successful migration
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250115_add_settings_rls_policies.sql', 'success', 'Settings RLS policies migration ran successfully.');
    END IF;
END $$;
