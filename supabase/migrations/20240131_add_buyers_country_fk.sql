ALTER TABLE buyers ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

UPDATE buyers b
SET country_id = c.id
FROM countries c
WHERE b.country IS NOT NULL 
  AND (LOWER(b.country) = LOWER(c.name) OR LOWER(b.country) = LOWER(c.code));

CREATE INDEX IF NOT EXISTS idx_buyers_country_id ON buyers(country_id);

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

UPDATE suppliers s
SET country_id = c.id
FROM countries c
WHERE s.country IS NOT NULL 
  AND (LOWER(s.country) = LOWER(c.name) OR LOWER(s.country) = LOWER(c.code));

CREATE INDEX IF NOT EXISTS idx_suppliers_country_id ON suppliers(country_id);
