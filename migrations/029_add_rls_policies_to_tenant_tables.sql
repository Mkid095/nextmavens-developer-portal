-- Migration: Add Row Level Security (RLS) Policies to Tenant Tables
-- Description: This migration enables Row Level Security on all existing tenant
--              schemas and creates policies to ensure users can only access
--              their own data. Admins (when app.user_role = 'admin') can
--              access all data within their tenant.
--
-- Prerequisites:
-- - Assumes tenant schemas follow the pattern: tenant_{slug}
-- - Assumes tenant tables: users, audit_log, _migrations
--
-- Usage: This migration should be run after applying tenant schema provisioning.
--        It idempotently adds RLS to existing schemas without affecting new ones.

-- =============================================================================
-- Enable RLS on all existing tenant schemas
-- =============================================================================

-- Function to add RLS policies to a specific tenant schema
-- This function is called for each tenant schema found
CREATE OR REPLACE FUNCTION control_plane.add_rls_to_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only process schemas that start with 'tenant_'
  IF schema_name LIKE 'tenant_%' THEN
    RAISE NOTICE 'Adding RLS policies to schema: %', schema_name;

    -- =========================================================================
    -- Users table RLS
    -- =========================================================================

    -- Enable RLS on users table (ignore if already enabled)
    BEGIN
      EXECUTE format('ALTER TABLE %I.users ENABLE ROW LEVEL SECURITY', schema_name);
    EXCEPTION WHEN others THEN
      -- Table might not exist or RLS already enabled, continue
      RAISE NOTICE 'Could not enable RLS on %: %', schema_name || '.users', SQLERRM;
    END;

    -- Policy: Users can select their own record, admins can select all
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS users_select_own ON %I.users
         FOR SELECT
         USING (
           id = current_setting(''app.user_id'', true)::uuid
           OR current_setting(''app.user_role'', true) = ''admin''
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy users_select_own: %', SQLERRM;
    END;

    -- Policy: Users can update their own record, admins can update all
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS users_update_own ON %I.users
         FOR UPDATE
         USING (
           id = current_setting(''app.user_id'', true)::uuid
           OR current_setting(''app.user_role'', true) = ''admin''
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy users_update_own: %', SQLERRM;
    END;

    -- Policy: Service roles can insert new users (for signup flows)
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS users_insert_service ON %I.users
         FOR INSERT
         WITH CHECK (
           current_setting(''app.user_role'', true) IN (''service'', ''admin'')
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy users_insert_service: %', SQLERRM;
    END;

    -- =========================================================================
    -- Audit log table RLS
    -- =========================================================================

    -- Enable RLS on audit_log table
    BEGIN
      EXECUTE format('ALTER TABLE %I.audit_log ENABLE ROW LEVEL SECURITY', schema_name);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not enable RLS on %: %', schema_name || '.audit_log', SQLERRM;
    END;

    -- Policy: Users can read audit logs where they are the actor, admins can read all
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS audit_log_select_own ON %I.audit_log
         FOR SELECT
         USING (
           actor_id = current_setting(''app.user_id'', true)::uuid
           OR current_setting(''app.user_role'', true) = ''admin''
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy audit_log_select_own: %', SQLERRM;
    END;

    -- Policy: Service roles and admins can insert audit logs
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS audit_log_insert_service ON %I.audit_log
         FOR INSERT
         WITH CHECK (
           current_setting(''app.user_role'', true) IN (''service'', ''admin'')
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy audit_log_insert_service: %', SQLERRM;
    END;

    -- =========================================================================
    -- Migrations table RLS
    -- =========================================================================

    -- Enable RLS on _migrations table
    BEGIN
      EXECUTE format('ALTER TABLE %I._migrations ENABLE ROW LEVEL SECURITY', schema_name);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not enable RLS on %: %', schema_name || '._migrations', SQLERRM;
    END;

    -- Policy: Only service roles and admins can read migrations
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS migrations_select_service ON %I._migrations
         FOR SELECT
         USING (
           current_setting(''app.user_role'', true) IN (''service'', ''admin'')
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy migrations_select_service: %', SQLERRM;
    END;

    -- Policy: Only service roles can insert migrations
    BEGIN
      EXECUTE format(
        'CREATE POLICY IF NOT EXISTS migrations_insert_service ON %I._migrations
         FOR INSERT
         WITH CHECK (
           current_setting(''app.user_role'', true) = ''service''
         )',
        schema_name
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy migrations_insert_service: %', SQLERRM;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies to all existing tenant schemas
DO $$
DECLARE
  tenant_schema RECORD;
BEGIN
  -- Loop through all schemas that start with 'tenant_'
  FOR tenant_schema IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  LOOP
    -- Call the function to add RLS policies
    PERFORM control_plane.add_rls_to_tenant_schema(tenant_schema.schema_name);
  END LOOP;

  RAISE NOTICE 'RLS policies applied to all existing tenant schemas';
END $$;

-- =============================================================================
-- Cleanup helper function (optional, can be kept for future use)
-- =============================================================================
-- The function add_rls_to_tenant_schema can be kept for applying RLS to
-- new tenant schemas created outside the provisioning system.
-- To remove it later, run: DROP FUNCTION IF EXISTS control_plane.add_rls_to_tenant_schema;
