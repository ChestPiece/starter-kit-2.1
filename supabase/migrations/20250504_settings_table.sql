DO $$ 
BEGIN
    -- Check if the migration '20250504_settings_table.sql' has already been executed successfully
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250504_settings_table.sql'
        AND status = 'success'
    ) THEN

        -- Create settings table with configurable site properties
        CREATE TABLE settings (
            id SERIAL PRIMARY KEY,
            site_name TEXT,
            site_image TEXT,
            appearance_theme TEXT,
            primary_color TEXT,
            secondary_color TEXT,
            logo_url TEXT,
            favicon_url TEXT,
            site_description TEXT,
            meta_keywords TEXT,
            contact_email TEXT,
            social_links JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
  -- Log the successful migration
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250504_settings_table.sql', 'success', 'Settings table migration ran successfully.');
    END IF;
END $$; 