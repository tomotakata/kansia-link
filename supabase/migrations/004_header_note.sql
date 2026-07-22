-- Add free-text header note field (displayed at the top row of the company PDF)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS header_note text;
