-- Add name column to hs_codes table
ALTER TABLE hs_codes ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update existing records to set name from description if null
UPDATE hs_codes SET name = LEFT(description, 255) WHERE name IS NULL;
