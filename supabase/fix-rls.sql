-- =============================================
-- ArogyaMaarga RLS Fix
-- Run in Supabase SQL Editor if you see:
--   "Database error querying schema"
-- =============================================

-- Step 1: Drop all recursive policies
DROP POLICY IF EXISTS "staff view all profiles" ON profiles;
DROP POLICY IF EXISTS "queue update staff" ON queue_entries;
DROP POLICY IF EXISTS "patient profiles access" ON patient_profiles;
DROP POLICY IF EXISTS "triage access" ON triage_records;
DROP POLICY IF EXISTS "appointments access" ON appointments;

-- Step 2: Security-definer function — reads role WITHOUT triggering RLS
-- This is the only safe way to check role inside a policy.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Step 3: Recreate policies using the function (no recursion)
CREATE POLICY "queue update staff" ON queue_entries FOR UPDATE USING (
  get_my_role() IN ('Super Admin', 'Receptionist', 'Doctor')
);

CREATE POLICY "patient profiles access" ON patient_profiles FOR ALL USING (
  id = auth.uid() OR get_my_role() IN ('Super Admin', 'Receptionist', 'Doctor')
);

CREATE POLICY "triage access" ON triage_records FOR ALL USING (
  patient_id = auth.uid() OR get_my_role() IN ('Super Admin', 'Receptionist', 'Doctor')
);

CREATE POLICY "appointments access" ON appointments FOR ALL USING (
  patient_id = auth.uid() OR
  doctor_id = auth.uid() OR
  get_my_role() IN ('Super Admin', 'Receptionist')
);

-- Step 4: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'RLS fix applied successfully' AS status;
