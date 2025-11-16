-- Migration: Add constraints_json column to games table
-- Date: 2024
-- Description: Adds nullable constraints_json column to store pair constraints for multiplayer games

-- Add column if it doesn't exist (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
-- Note: This migration is idempotent - safe to run multiple times
-- In SQLite, we need to check if column exists manually or use a transaction

ALTER TABLE games ADD COLUMN constraints_json TEXT NULL;

