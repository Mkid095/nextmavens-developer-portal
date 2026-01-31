-- Migration: Create developers table
-- Description: Create developers table for developer authentication and user management
-- Version: 027

-- Create developers table for developer accounts
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for login queries
CREATE INDEX IF NOT EXISTS idx_developers_email
ON public.developers(email);

-- Create index on organization for team queries
CREATE INDEX IF NOT EXISTS idx_developers_organization
ON public.developers(organization);

-- Create index on created_at for sorting by registration date
CREATE INDEX IF NOT EXISTS idx_developers_created_at
ON public.developers(created_at DESC);

-- Add comment to table
COMMENT ON TABLE public.developers IS 'Developer accounts for platform authentication';

-- Add comments to columns
COMMENT ON COLUMN public.developers.id IS 'Unique developer identifier';
COMMENT ON COLUMN public.developers.email IS 'Developer email address (used for login)';
COMMENT ON COLUMN public.developers.password_hash IS 'Bcrypt hash of the developer password';
COMMENT ON COLUMN public.developers.name IS 'Developer full name';
COMMENT ON COLUMN public.developers.organization IS 'Optional organization or company name';
COMMENT ON COLUMN public.developers.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.developers.updated_at IS 'Last update timestamp';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('027', 'Create developers table', FALSE);
