-- =============================================
-- ArogyaMaarga Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS triage_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS queue_entries CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS doctor_profiles CASCADE;
DROP TABLE IF EXISTS staff_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS ai_demo_logs CASCADE;

-- =============================================
-- PROFILES (base for all users)
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

-- =============================================
-- PATIENT PROFILES
-- =============================================
CREATE TABLE patient_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  date_of_birth DATE,
  age INT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  patient_type TEXT DEFAULT 'OPD' CHECK (patient_type IN ('OPD', 'IPD', 'Emergency', 'Referral', 'Telemedicine')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  city TEXT,
  medical_history TEXT[],
  allergies TEXT[],
  insurance_id TEXT,
  referred_by TEXT
);

-- =============================================
-- DOCTOR PROFILES
-- =============================================
CREATE TABLE doctor_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
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

-- =============================================
-- STAFF PROFILES
-- =============================================
CREATE TABLE staff_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  department TEXT,
  shift TEXT DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Evening', 'Night')),
  employee_id TEXT UNIQUE
);

-- =============================================
-- QUEUE ENTRIES
-- =============================================
CREATE TABLE queue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  token TEXT NOT NULL,
  department TEXT NOT NULL,
  doctor_id UUID REFERENCES doctor_profiles(id),
  status TEXT DEFAULT 'Registered' CHECK (status IN ('Registered', 'Waiting', 'File With Doctor', 'Your Turn', 'Completed', 'Cancelled')),
  patient_type TEXT DEFAULT 'OPD' CHECK (patient_type IN ('OPD', 'IPD', 'Emergency', 'Referral', 'Telemedicine')),
  is_emergency BOOLEAN DEFAULT FALSE,
  symptoms TEXT,
  triage_score INT DEFAULT 3 CHECK (triage_score BETWEEN 1 AND 5),
  triage_urgency TEXT DEFAULT 'Moderate' CHECK (triage_urgency IN ('Safe', 'Moderate', 'Emergency')),
  wait_minutes INT DEFAULT 30,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- =============================================
-- TRIAGE RECORDS
-- =============================================
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

-- =============================================
-- APPOINTMENTS
-- =============================================
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  doctor_id UUID REFERENCES doctor_profiles(id),
  queue_entry_id UUID REFERENCES queue_entries(id),
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  chief_complaint TEXT,
  soap_notes JSONB,
  prescription JSONB,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and staff can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('Super Admin', 'Receptionist', 'Doctor')
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Doctor profiles: readable by all authenticated users
CREATE POLICY "Doctors readable by all" ON doctor_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Queue: readable by all authenticated (patients see own, staff sees all)
CREATE POLICY "Queue readable by authenticated" ON queue_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Queue insertable by authenticated" ON queue_entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Queue updatable by staff and doctors" ON queue_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('Super Admin', 'Receptionist', 'Doctor')
    )
  );

-- Patient profiles: own data + staff
CREATE POLICY "Patient profiles own or staff" ON patient_profiles
  FOR ALL USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('Super Admin', 'Receptionist', 'Doctor')
    )
  );

-- Triage: own or staff
CREATE POLICY "Triage records own or staff" ON triage_records
  FOR ALL USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('Super Admin', 'Receptionist', 'Doctor')
    )
  );

-- Appointments: own or staff
CREATE POLICY "Appointments own or staff" ON appointments
  FOR ALL USING (
    patient_id = auth.uid() OR
    doctor_id IN (SELECT id FROM doctor_profiles WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('Super Admin', 'Receptionist')
    )
  );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_queue_entries_status ON queue_entries(status);
CREATE INDEX idx_queue_entries_patient ON queue_entries(patient_id);
CREATE INDEX idx_queue_entries_doctor ON queue_entries(doctor_id);
CREATE INDEX idx_queue_entries_department ON queue_entries(department);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

-- =============================================
-- FUNCTIONS
-- =============================================
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
