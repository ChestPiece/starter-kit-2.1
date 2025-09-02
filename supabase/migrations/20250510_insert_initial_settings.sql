DO $$ 
BEGIN
    -- Check if the migration '20250510_insert_initial_settings.sql' has already been executed successfully
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250510_insert_initial_settings.sql'
        AND status = 'success'
    ) THEN

        -- Insert initial settings record if none exists
        INSERT INTO public.settings (
            id,
            site_name,
            logo_url,
            logo_horizontal_url,
            favicon_url,
            logo_setting,
            primary_color,
            secondary_color,
            appearance_theme,
            site_description,
            contact_email,
            created_at,
            updated_at
        )
        SELECT 
            1,
            'Starter Kit',
            '/favicon.ico',
            '/favicon.ico',
            '/favicon.ico',
            'square',
            '#3b82f6',
            '#1e40af',
            'light',
            'Starter Kit Application',
            'support@example.com',
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.settings WHERE id = 1
        );

        -- Log the successful migration
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250510_insert_initial_settings.sql', 'success', 'Initial settings data migration ran successfully.');
    END IF;
END $$;
