-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- companies table
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id                     bigserial PRIMARY KEY,
  is_hidden              boolean NOT NULL DEFAULT false,
  registered_at          date,
  star_rating            smallint CHECK (star_rating BETWEEN 1 AND 5),
  company_name           text NOT NULL,
  company_name_kana      text,
  company_phone          text,
  company_fax            text,
  birth_era              text CHECK (birth_era IN ('西暦', 'S', 'H')),
  birth_year             int,
  birth_month            int CHECK (birth_month BETWEEN 1 AND 12),
  birth_day              int CHECK (birth_day BETWEEN 1 AND 31),
  gender                 text CHECK (gender IN ('男性', '女性')),
  rep_name               text,
  rep_name_kana          text,
  mobile_phone           text,
  home_phone             text,
  email                  text,
  family_members         jsonb NOT NULL DEFAULT '[]',
  company_address_type   text CHECK (company_address_type IN ('賃貸', '所有')),
  company_address_owner  text,
  company_postal_code    text,
  company_prefecture     text,
  company_city           text,
  company_street         text,
  rep_address_same       boolean NOT NULL DEFAULT false,
  rep_address_type       text CHECK (rep_address_type IN ('賃貸', '所有')),
  rep_address_owner      text,
  rep_postal_code        text,
  rep_prefecture         text,
  rep_city               text,
  rep_street             text,
  capital                numeric(15, 2),
  monthly_revenue        numeric(15, 2),
  employees              int,
  founded_year           int,
  purchase_amount        numeric(15, 2),
  purchase_date          date,
  payday                 int CHECK (payday BETWEEN 1 AND 31),
  total_salary           numeric(15, 2),
  business_description   text,
  current_account        text CHECK (current_account IN ('なし', 'あり')) DEFAULT 'なし',
  payment_schedule       jsonb NOT NULL DEFAULT '[]',
  tax_payment_status     text CHECK (tax_payment_status IN ('未納', '完納')),
  tax_payment_detail     text,
  other_companies        text,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- profiles table (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes for search performance (12,000+ records)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_company_name      ON companies USING gin(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_company_name_kana ON companies USING gin(company_name_kana gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_rep_name          ON companies USING gin(rep_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_rep_name_kana     ON companies USING gin(rep_name_kana gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_mobile_phone      ON companies USING gin(mobile_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_prefecture        ON companies (company_prefecture);
CREATE INDEX IF NOT EXISTS idx_companies_monthly_revenue   ON companies (monthly_revenue);
CREATE INDEX IF NOT EXISTS idx_companies_star_rating       ON companies (star_rating);
CREATE INDEX IF NOT EXISTS idx_companies_is_hidden         ON companies (is_hidden);
CREATE INDEX IF NOT EXISTS idx_companies_created_at        ON companies (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_id_asc            ON companies (id ASC);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS companies_updated_at ON companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
