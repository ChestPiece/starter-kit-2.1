DO $$ 
BEGIN
CREATE TABLE IF NOT EXISTS public.migration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    migration_name TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'success' or 'failed'
    message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

    -- Check if the migration '20250502_initial_schema.sql' has already been executed successfully
    IF NOT EXISTS (
        SELECT 1
        FROM public.migration_logs
        WHERE migration_name = '20250502_initial_schema.sql'
        AND status = 'success'
    ) THEN
        -- Start the migration commands here
        
        -- Create roles table
        CREATE TABLE IF NOT EXISTS public.roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Create role_access table
        CREATE TABLE IF NOT EXISTS public.role_access (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
            resource TEXT NOT NULL,
            action TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(role_id, resource, action)
        );

        -- Create user_profile table
        CREATE TABLE IF NOT EXISTS public.user_profile (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            email TEXT UNIQUE NOT NULL,
            role_id UUID NOT NULL REFERENCES public.roles(id),
            first_name TEXT,
            last_name TEXT,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Insert default roles
        INSERT INTO public.roles (id, name, description)
        VALUES
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'admin', 'Administrator with full access'),
            ('e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4', 'manager', 'Manager with elevated access'),
            ('d9a0935b-9fe1-4550-8f7e-67639fd0c6f0', 'user', 'Regular user with basic access')
        ON CONFLICT (name) DO NOTHING;

        -- Insert default role access
        INSERT INTO public.role_access (role_id, resource, action)
        VALUES
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'users', 'create'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'users', 'read'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'users', 'update'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'users', 'delete'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'roles', 'create'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'roles', 'read'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'roles', 'update'),
            ('a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4', 'roles', 'delete'),
            ('e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4', 'users', 'read'),
            ('e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4', 'users', 'update'),
            ('e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4', 'roles', 'read'),
            ('d9a0935b-9fe1-4550-8f7e-67639fd0c6f0', 'users', 'read')
        ON CONFLICT (role_id, resource, action) DO NOTHING;

        -- Enable Row Level Security
        ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.role_access ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Roles are viewable by everyone" ON public.roles FOR SELECT USING (true);
        -- CREATE POLICY "Only admins can manage roles" ON public.roles FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profile WHERE user_profile.id = auth.uid() AND user_profile.role_id = 'a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4'));
        CREATE POLICY "Role access is viewable by everyone" ON public.role_access FOR SELECT USING (true);
        -- CREATE POLICY "Only admins can manage role access" ON public.role_access FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profile WHERE user_profile.id = auth.uid() AND user_profile.role_id = 'a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4'));
        CREATE POLICY "Users can view their own data" ON public.user_profile FOR SELECT USING (auth.uid() = id);
        CREATE POLICY "Users can update their own data" ON public.user_profile FOR UPDATE USING (auth.uid() = id);
        -- CREATE POLICY "Admins can manage all users" ON public.user_profile FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profile WHERE user_profile.id = auth.uid() AND user_profile.role_id = 'a0eeb1f4-6b6e-4d1a-b1f7-72e1bb78c8d4'));

        -- Log the successful migration
        INSERT INTO public.migration_logs (migration_name, status, message)
        VALUES ('20250502_initial_schema.sql', 'success', 'Initial schema migration ran successfully.');
    END IF;
END $$;
