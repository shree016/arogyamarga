-- =============================================
-- ArogyaMaarga Complete Setup SQL  v4
-- Run this ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================

-- =============================================
-- STEP 1: DROP EXISTING TABLES
-- =============================================
DROP TABLE IF EXISTS triage_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS queue_entries CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS doctor_profiles CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS ai_demo_logs CASCADE;

-- =============================================
-- STEP 2: CLEAN AUTH USERS (all seed accounts)
-- =============================================
DELETE FROM auth.users WHERE email IN (
  -- ID-based accounts (v2)
  'adm001@arogyamaarga.in',
  'dt101@arogyamaarga.in',
  'dt102@arogyamaarga.in',
  'dt103@arogyamaarga.in',
  'dt104@arogyamaarga.in',
  'dt105@arogyamaarga.in',
  'st101@arogyamaarga.in',
  'st102@arogyamaarga.in',
  -- Old name-based accounts (v1 cleanup)
  'admin@arogyamaarga.in',
  'aarav.iyer@arogyamaarga.in',
  'anika.rao@arogyamaarga.in',
  'rohan.mehta@arogyamaarga.in',
  'kavya.nair@arogyamaarga.in',
  'vihaan.das@arogyamaarga.in',
  'priya.sharma@arogyamaarga.in',
  'ravi.kumar@arogyamaarga.in',
  -- Demo patient accounts (pt000X@guest.arogyamaarga.in format)
  'pt0001@guest.arogyamaarga.in',
  'pt0002@guest.arogyamaarga.in',
  'pt0003@guest.arogyamaarga.in',
  'pt0004@guest.arogyamaarga.in',
  'pt0005@guest.arogyamaarga.in',
  -- Old gmail accounts (v2 cleanup)
  'anaya.kulkarni@gmail.com',
  'arjun.sharma@gmail.com',
  'zoya.siddiqui@gmail.com',
  'rahul.nair@gmail.com',
  'priya.venkatesh@gmail.com'
);

-- Drop old helper function if exists
DROP FUNCTION IF EXISTS get_my_role();

-- =============================================
-- STEP 3: CREATE TABLES
-- =============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('Patient', 'Doctor', 'Receptionist', 'Super Admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patient_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  patient_id TEXT UNIQUE,               -- e.g. PT-0001 (generated at registration)
  date_of_birth DATE,
  age INT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  patient_type TEXT DEFAULT 'OPD' CHECK (patient_type IN ('OPD','IPD','Emergency','Referral','Telemedicine')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  city TEXT,
  medical_history TEXT[],
  allergies TEXT[],
  insurance_id TEXT,
  referred_by TEXT
);

CREATE TABLE doctor_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  doctor_id TEXT UNIQUE,                -- e.g. DT101
  specialty TEXT NOT NULL,
  department TEXT NOT NULL,
  qualification TEXT,
  experience_years INT DEFAULT 5,
  rating DECIMAL(3,2) DEFAULT 4.5,
  is_available BOOLEAN DEFAULT TRUE,
  consultation_fee INT DEFAULT 500,
  room_number TEXT,
  max_patients_per_day INT DEFAULT 30,
  current_patients_today INT DEFAULT 0
);

CREATE TABLE staff_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  staff_id TEXT UNIQUE,                 -- e.g. ST101
  department TEXT,
  shift TEXT DEFAULT 'Morning' CHECK (shift IN ('Morning','Evening','Night')),
  employee_id TEXT UNIQUE
);

CREATE TABLE queue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),  -- NULL for walk-in guest patients
  token TEXT NOT NULL,
  department TEXT NOT NULL,
  doctor_id UUID REFERENCES doctor_profiles(id),
  status TEXT DEFAULT 'Registered' CHECK (status IN ('Registered','Waiting','File With Doctor','Your Turn','Completed','Cancelled')),
  patient_type TEXT DEFAULT 'OPD' CHECK (patient_type IN ('OPD','IPD','Emergency','Referral','Telemedicine')),
  is_emergency BOOLEAN DEFAULT FALSE,
  symptoms TEXT,
  triage_score INT DEFAULT 3 CHECK (triage_score BETWEEN 1 AND 5),
  triage_urgency TEXT DEFAULT 'Moderate' CHECK (triage_urgency IN ('Safe','Moderate','Emergency')),
  wait_minutes INT DEFAULT 30,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE triage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  structured_intake JSONB,
  triage_result JSONB,
  ai_recommendation TEXT,
  follow_up_answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  doctor_id UUID REFERENCES doctor_profiles(id),
  queue_entry_id UUID REFERENCES queue_entries(id),
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled','No-Show')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  chief_complaint TEXT,
  soap_notes JSONB,
  prescription JSONB,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 4: ROW LEVEL SECURITY + HELPER FUNCTION
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Security-definer function reads the caller's role WITHOUT triggering RLS on
-- the profiles table, breaking the infinite-recursion cycle.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- profiles: users see/edit their own row only
--   (server-side admin queries use service-role key and bypass RLS entirely)
CREATE POLICY "own profile"        ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON profiles FOR INSERT WITH CHECK (true);

-- doctor_profiles: readable by all authenticated users
CREATE POLICY "doctors public read" ON doctor_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- queue_entries: readable/insertable by all authenticated; updates by staff/doctors
CREATE POLICY "queue read"   ON queue_entries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "queue insert" ON queue_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "queue update staff" ON queue_entries FOR UPDATE USING (
  get_my_role() IN ('Super Admin', 'Receptionist', 'Doctor')
);

-- patient_profiles: own or staff/doctor
CREATE POLICY "patient profiles access" ON patient_profiles FOR ALL USING (
  id = auth.uid() OR get_my_role() IN ('Super Admin', 'Receptionist', 'Doctor')
);

-- triage_records: own or staff/doctor
CREATE POLICY "triage access" ON triage_records FOR ALL USING (
  patient_id = auth.uid() OR get_my_role() IN ('Super Admin', 'Receptionist', 'Doctor')
);

-- appointments: own patient, own doctor, or admin/receptionist
CREATE POLICY "appointments access" ON appointments FOR ALL USING (
  patient_id = auth.uid() OR
  doctor_id  = auth.uid() OR
  get_my_role() IN ('Super Admin', 'Receptionist')
);

-- =============================================
-- STEP 5: INDEXES
-- =============================================
CREATE INDEX idx_queue_status  ON queue_entries(status);
CREATE INDEX idx_queue_patient ON queue_entries(patient_id);
CREATE INDEX idx_queue_doctor  ON queue_entries(doctor_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =============================================
-- STEP 6: SEED AUTH USERS (fixed UUIDs)
-- Login format:  ID  →  id@arogyamaarga.in
-- Patients have demo auth accounts for dashboard display only
-- =============================================

-- Admin  (ID: ADM001)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'adm001@arogyamaarga.in',
  crypt('Admin@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Suresh Kumar","role":"Super Admin"}',
  FALSE, NOW(), NOW()
);

-- Doctor 1  (ID: DT101)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dt101@arogyamaarga.in',
  crypt('Doctor@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Aarav Iyer","role":"Doctor"}',
  FALSE, NOW(), NOW()
);

-- Doctor 2  (ID: DT102)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dt102@arogyamaarga.in',
  crypt('Doctor@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Anika Rao","role":"Doctor"}',
  FALSE, NOW(), NOW()
);

-- Doctor 3  (ID: DT103)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dt103@arogyamaarga.in',
  crypt('Doctor@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Rohan Mehta","role":"Doctor"}',
  FALSE, NOW(), NOW()
);

-- Doctor 4  (ID: DT104)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dt104@arogyamaarga.in',
  crypt('Doctor@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Kavya Nair","role":"Doctor"}',
  FALSE, NOW(), NOW()
);

-- Doctor 5  (ID: DT105)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'dt105@arogyamaarga.in',
  crypt('Doctor@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Vihaan Das","role":"Doctor"}',
  FALSE, NOW(), NOW()
);

-- Staff 1  (ID: ST101)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'st101@arogyamaarga.in',
  crypt('Staff@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Priya Sharma","role":"Receptionist"}',
  FALSE, NOW(), NOW()
);

-- Staff 2  (ID: ST102)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'st102@arogyamaarga.in',
  crypt('Staff@123', gen_salt('bf')),
  NOW(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ravi Kumar","role":"Receptionist"}',
  FALSE, NOW(), NOW()
);

-- Demo patients  (login: PT-0001 → Patient@0001)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pt0001@guest.arogyamaarga.in',crypt('Patient@0001',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Anaya Kulkarni","role":"Patient"}',FALSE,NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pt0002@guest.arogyamaarga.in',crypt('Patient@0002',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Arjun Sharma","role":"Patient"}',FALSE,NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pt0003@guest.arogyamaarga.in',crypt('Patient@0003',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Zoya Siddiqui","role":"Patient"}',FALSE,NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pt0004@guest.arogyamaarga.in',crypt('Patient@0004',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Rahul Nair","role":"Patient"}',FALSE,NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pt0005@guest.arogyamaarga.in',crypt('Patient@0005',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Priya Venkatesh","role":"Patient"}',FALSE,NOW(),NOW());

-- =============================================
-- STEP 6b: SEED AUTH IDENTITIES
-- signInWithPassword requires a row in auth.identities per user.
-- Raw SQL inserts into auth.users don't create this automatically.
-- =============================================
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','{"sub":"00000000-0000-0000-0000-000000000001","email":"adm001@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','{"sub":"00000000-0000-0000-0000-000000000002","email":"dt101@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','{"sub":"00000000-0000-0000-0000-000000000003","email":"dt102@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','{"sub":"00000000-0000-0000-0000-000000000004","email":"dt103@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000005','{"sub":"00000000-0000-0000-0000-000000000005","email":"dt104@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000006','{"sub":"00000000-0000-0000-0000-000000000006","email":"dt105@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000007','{"sub":"00000000-0000-0000-0000-000000000007","email":"st101@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000008','{"sub":"00000000-0000-0000-0000-000000000008","email":"st102@arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000009','{"sub":"00000000-0000-0000-0000-000000000009","email":"pt0001@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000010','{"sub":"00000000-0000-0000-0000-000000000010","email":"pt0002@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011','{"sub":"00000000-0000-0000-0000-000000000011","email":"pt0003@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000012','{"sub":"00000000-0000-0000-0000-000000000012","email":"pt0004@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW()),
  ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000013','{"sub":"00000000-0000-0000-0000-000000000013","email":"pt0005@guest.arogyamaarga.in","email_verified":true,"phone_verified":false}','email',NOW(),NOW(),NOW())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- =============================================
-- STEP 7: SEED PROFILES
-- =============================================
INSERT INTO profiles (id, role, full_name, email, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Super Admin',   'Dr. Suresh Kumar',  'adm001@arogyamaarga.in', '+91 98765 00001'),
  ('00000000-0000-0000-0000-000000000002', 'Doctor',        'Dr. Aarav Iyer',    'dt101@arogyamaarga.in',  '+91 98765 00002'),
  ('00000000-0000-0000-0000-000000000003', 'Doctor',        'Dr. Anika Rao',     'dt102@arogyamaarga.in',  '+91 98765 00003'),
  ('00000000-0000-0000-0000-000000000004', 'Doctor',        'Dr. Rohan Mehta',   'dt103@arogyamaarga.in',  '+91 98765 00004'),
  ('00000000-0000-0000-0000-000000000005', 'Doctor',        'Dr. Kavya Nair',    'dt104@arogyamaarga.in',  '+91 98765 00005'),
  ('00000000-0000-0000-0000-000000000006', 'Doctor',        'Dr. Vihaan Das',    'dt105@arogyamaarga.in',  '+91 98765 00006'),
  ('00000000-0000-0000-0000-000000000007', 'Receptionist',  'Priya Sharma',      'st101@arogyamaarga.in',  '+91 98765 00007'),
  ('00000000-0000-0000-0000-000000000008', 'Receptionist',  'Ravi Kumar',        'st102@arogyamaarga.in',  '+91 98765 00008'),
  ('00000000-0000-0000-0000-000000000009', 'Patient',       'Anaya Kulkarni',    'pt0001@guest.arogyamaarga.in', '+91 98765 10001'),
  ('00000000-0000-0000-0000-000000000010', 'Patient',       'Arjun Sharma',      'pt0002@guest.arogyamaarga.in', '+91 98765 10002'),
  ('00000000-0000-0000-0000-000000000011', 'Patient',       'Zoya Siddiqui',     'pt0003@guest.arogyamaarga.in', '+91 98765 10003'),
  ('00000000-0000-0000-0000-000000000012', 'Patient',       'Rahul Nair',        'pt0004@guest.arogyamaarga.in', '+91 98765 10004'),
  ('00000000-0000-0000-0000-000000000013', 'Patient',       'Priya Venkatesh',   'pt0005@guest.arogyamaarga.in', '+91 98765 10005');

-- =============================================
-- STEP 8: DOCTOR PROFILES  (doctor_id = login ID)
-- =============================================
INSERT INTO doctor_profiles (id, doctor_id, specialty, department, qualification, experience_years, rating, consultation_fee, room_number) VALUES
  ('00000000-0000-0000-0000-000000000002', 'DT101', 'Orthopedics',       'Orthopedics',     'MBBS, MS (Ortho), FRCS',        14, 4.8,  800, 'OPD-201'),
  ('00000000-0000-0000-0000-000000000003', 'DT102', 'Neurology',         'Neuro Care',      'MBBS, MD (Neuro), DM',          11, 4.9, 1000, 'OPD-301'),
  ('00000000-0000-0000-0000-000000000004', 'DT103', 'Internal Medicine', 'General Medicine','MBBS, MD (Medicine)',            8,  4.7,  600, 'OPD-101'),
  ('00000000-0000-0000-0000-000000000005', 'DT104', 'Pulmonology',       'Respiratory',     'MBBS, MD (Pulmonology)',         9,  4.8,  700, 'OPD-401'),
  ('00000000-0000-0000-0000-000000000006', 'DT105', 'Gastroenterology',  'Digestive Health','MBBS, MD, DM (Gastro)',          12, 4.6,  900, 'OPD-501');

-- =============================================
-- STEP 9: STAFF PROFILES  (staff_id = login ID)
-- =============================================
INSERT INTO staff_profiles (id, staff_id, department, shift, employee_id) VALUES
  ('00000000-0000-0000-0000-000000000007', 'ST101', 'Front Desk', 'Morning', 'EMP-001'),
  ('00000000-0000-0000-0000-000000000008', 'ST102', 'Emergency',  'Evening', 'EMP-002');

-- =============================================
-- STEP 10: PATIENT PROFILES (demo data)
-- =============================================
INSERT INTO patient_profiles (id, patient_id, age, gender, blood_group, patient_type, date_of_birth, address, city, medical_history, allergies, emergency_contact_name, emergency_contact_phone) VALUES
  ('00000000-0000-0000-0000-000000000009', 'PT-0001', 28, 'Female', 'B+',  'OPD',          '1996-04-15', '12, MG Road',    'Bengaluru', ARRAY['Seasonal allergies','Mild asthma'],          ARRAY['Penicillin'],   'Ravi Kulkarni',  '+91 98765 10099'),
  ('00000000-0000-0000-0000-000000000010', 'PT-0002', 45, 'Male',   'O+',  'IPD',          '1979-08-22', '45, Indiranagar','Bengaluru', ARRAY['Hypertension','Type-2 Diabetes'],            ARRAY[]::TEXT[],       'Sunita Sharma',  '+91 98765 10098'),
  ('00000000-0000-0000-0000-000000000011', 'PT-0003', 32, 'Female', 'A+',  'Telemedicine', '1992-11-05', '78, Koramangala','Bengaluru', ARRAY['Migraine'],                                  ARRAY['Aspirin'],      'Faiz Siddiqui',  '+91 98765 10097'),
  ('00000000-0000-0000-0000-000000000012', 'PT-0004', 62, 'Male',   'AB+', 'Referral',     '1962-03-10', '22, Jayanagar',  'Bengaluru', ARRAY['Coronary Artery Disease','High Cholesterol'], ARRAY['Sulfa drugs'],  'Meera Nair',     '+91 98765 10096'),
  ('00000000-0000-0000-0000-000000000013', 'PT-0005', 35, 'Female', 'O-',  'Emergency',    '1989-07-19', '90, HSR Layout', 'Bengaluru', ARRAY[]::TEXT[],                                    ARRAY[]::TEXT[],       'Siva Venkatesh', '+91 98765 10095');

UPDATE patient_profiles SET referred_by = 'Dr. Vijay Menon, City General Hospital'
WHERE id = '00000000-0000-0000-0000-000000000012';

-- =============================================
-- STEP 11: QUEUE ENTRIES (demo data)
-- =============================================
INSERT INTO queue_entries (patient_id, token, department, doctor_id, status, patient_type, is_emergency, symptoms, triage_score, triage_urgency, wait_minutes) VALUES
  ('00000000-0000-0000-0000-000000000009', 'AM-021', 'General Medicine', '00000000-0000-0000-0000-000000000004', 'Waiting',          'OPD',          FALSE, 'Headache and mild fever since morning',   3, 'Moderate',  18),
  ('00000000-0000-0000-0000-000000000010', 'AM-022', 'General Medicine', '00000000-0000-0000-0000-000000000004', 'File With Doctor', 'IPD',          FALSE, 'Blood sugar spike, feeling dizzy',        4, 'Moderate',   6),
  ('00000000-0000-0000-0000-000000000011', 'AM-023', 'Neuro Care',       '00000000-0000-0000-0000-000000000003', 'Registered',       'Telemedicine', FALSE, 'Severe migraine with nausea',             3, 'Moderate',  24),
  ('00000000-0000-0000-0000-000000000013', 'EM-001', 'Emergency',        NULL,                                   'Your Turn',        'Emergency',    TRUE,  'Chest pain, shortness of breath',         5, 'Emergency',  0),
  ('00000000-0000-0000-0000-000000000012', 'AM-024', 'General Medicine', '00000000-0000-0000-0000-000000000004', 'Registered',       'Referral',     FALSE, 'Follow-up for cardiac evaluation',        3, 'Moderate',  32);

-- =============================================
-- STEP 12: APPOINTMENTS (demo data)
-- =============================================
INSERT INTO appointments (patient_id, doctor_id, status, scheduled_at, chief_complaint, soap_notes) VALUES
  (
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000004',
    'Completed',
    NOW() - INTERVAL '2 days',
    'Recurring headache with light sensitivity',
    '{"subjective":"Patient reports recurring headache with sensitivity to light. No prior neuro history. Sleep disturbed for 2 nights.","objective":"Vitals stable. BP 122/80. Neuro exam normal. Mild sinus tenderness.","assessment":"Likely tension headache with possible sinus involvement. No red flags.","plan":"Recommend hydration, mild analgesics, nasal decongestant. Follow up in 48 hours."}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000004',
    'Scheduled',
    NOW() + INTERVAL '1 day',
    'Diabetes management follow-up',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000002',
    'Scheduled',
    NOW() + INTERVAL '2 hours',
    'Cardiac follow-up and ECG review',
    NULL
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- =============================================
-- SUCCESS CHECK
-- =============================================
SELECT
  'ArogyaMaarga v4 setup complete!' AS status,
  (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@arogyamaarga.in' AND email NOT LIKE '%@guest%') AS staff_auth_users,
  (SELECT COUNT(*) FROM doctor_profiles) AS doctors,
  (SELECT COUNT(*) FROM staff_profiles) AS staff,
  (SELECT COUNT(*) FROM patient_profiles) AS demo_patients,
  (SELECT COUNT(*) FROM queue_entries) AS queue_entries;
