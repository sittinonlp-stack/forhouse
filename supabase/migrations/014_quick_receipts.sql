-- 014_quick_receipts.sql
-- Add quick_receipts column to projects table
-- Stores an array of quick-captured receipt objects:
-- [{ id, date, imageUrl, note, createdAt }]
-- Used by the mobile camera FAB feature (v24)

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS quick_receipts jsonb DEFAULT '[]'::jsonb;
