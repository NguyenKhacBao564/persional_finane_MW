-- Add color column to Category table
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS color TEXT;
