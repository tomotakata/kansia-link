-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- companies: authenticated users only
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_auth" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "companies_insert_auth" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "companies_update_auth" ON companies
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "companies_delete_auth" ON companies
  FOR DELETE TO authenticated USING (true);

-- profiles: own record only (service_role bypasses RLS for admin operations)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
