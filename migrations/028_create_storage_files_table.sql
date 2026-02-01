-- Migration: Create storage_files table
-- Description: Create storage_files table for tracking uploaded files in Telegram/Cloudinary storage
-- Version: 028
-- PRD: Storage Service Implementation

-- Create storage_files table in control_plane schema
CREATE TABLE IF NOT EXISTS control_plane.storage_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path VARCHAR(600) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  content_type VARCHAR(255) NOT NULL,
  backend VARCHAR(20) NOT NULL CHECK (backend IN ('telegram', 'cloudinary')),
  file_id VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  etag VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on project_id for querying files by project
CREATE INDEX IF NOT EXISTS idx_storage_files_project_id
ON control_plane.storage_files(project_id);

-- Create index on storage_path for fast lookups
CREATE INDEX IF NOT EXISTS idx_storage_files_storage_path
ON control_plane.storage_files(storage_path);

-- Create index on backend for filtering by storage backend
CREATE INDEX IF NOT EXISTS idx_storage_files_backend
ON control_plane.storage_files(backend);

-- Create composite index on project_id and backend for stats queries
CREATE INDEX IF NOT EXISTS idx_storage_files_project_backend
ON control_plane.storage_files(project_id, backend);

-- Create index on uploaded_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_storage_files_uploaded_at
ON control_plane.storage_files(uploaded_at DESC);

-- Create index on file_name for searching by name
CREATE INDEX IF NOT EXISTS idx_storage_files_file_name
ON control_plane.storage_files(file_name);

-- Create index on content_type for filtering by type
CREATE INDEX IF NOT EXISTS idx_storage_files_content_type
ON control_plane.storage_files(content_type);

-- Add comments for documentation
COMMENT ON TABLE control_plane.storage_files IS 'Tracks files uploaded to Telegram or Cloudinary storage with project-scoped paths';

COMMENT ON COLUMN control_plane.storage_files.id IS 'Unique identifier for the file record';

COMMENT ON COLUMN control_plane.storage_files.project_id IS 'Reference to the project this file belongs to (INTEGER)';

COMMENT ON COLUMN control_plane.storage_files.storage_path IS 'Full storage path with project_id prefix (e.g., "project-123:/uploads/image.png")';

COMMENT ON COLUMN control_plane.storage_files.file_name IS 'Original file name';

COMMENT ON COLUMN control_plane.storage_files.file_size IS 'File size in bytes';

COMMENT ON COLUMN control_plane.storage_files.content_type IS 'MIME content type';

COMMENT ON COLUMN control_plane.storage_files.backend IS 'Storage backend used: telegram or cloudinary';

COMMENT ON COLUMN control_plane.storage_files.file_id IS 'Telegram file ID or Cloudinary public_id';

COMMENT ON COLUMN control_plane.storage_files.file_url IS 'CDN URL for direct file access';

COMMENT ON COLUMN control_plane.storage_files.etag IS 'ETag for versioning';

COMMENT ON COLUMN control_plane.storage_files.metadata IS 'Additional metadata (last accessed, custom tags, etc.)';

COMMENT ON COLUMN control_plane.storage_files.uploaded_at IS 'When the file was uploaded';

-- Insert migration record
INSERT INTO control_plane.schema_migrations (version, description, breaking)
VALUES ('028', 'Create storage_files table for tracking uploaded files in Telegram/Cloudinary storage', FALSE);
