-- Idempotent schema + seed for Arogya Maarga
-- Run this in Supabase SQL editor (recommended) or provide SUPABASE_SERVICE_ROLE_KEY to let the agent apply it.

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id text PRIMARY KEY,
  name text NOT NULL,
  specialty text,
  department text,
  rating numeric,
  distance_km numeric,
  wait_minutes integer,
  image text,
  highlight text,
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Create intakes table
CREATE TABLE IF NOT EXISTS public.intakes (
  id text PRIMARY KEY,
  patient_id text REFERENCES public.patients(id) ON DELETE SET NULL,
  structured jsonb,
  triage_result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create queue_tokens table
CREATE TABLE IF NOT EXISTS public.queue_tokens (
  id text PRIMARY KEY,
  token text NOT NULL,
  patient_id text REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id text REFERENCES public.doctors(id) ON DELETE SET NULL,
  department text,
  status text,
  wait_minutes integer,
  emergency boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seed doctors (idempotent)
INSERT INTO public.doctors (id, name, specialty, department, rating, distance_km, wait_minutes, image, highlight)
VALUES
  ('doc-0','Dr. Aarav Iyer','Orthopedics','Orthopedics',4.8,2.4,16,'/doctors/doctor-4.svg','Best Match'),
  ('doc-1','Dr. Anika Rao','Neurology','Neuro Care',4.9,2.1,18,'/doctors/doctor-1.svg','Top Rated'),
  ('doc-2','Dr. Rohan Mehta','Internal Medicine','General Medicine',4.7,3.6,24,'/doctors/doctor-2.svg',NULL),
  ('doc-3','Dr. Kavya Nair','Pulmonology','Respiratory',4.8,4.3,12,'/doctors/doctor-3.svg',NULL),
  ('doc-4','Dr. Vihaan Das','Gastroenterology','Digestive Health',4.6,5.1,32,'/doctors/doctor-1.svg',NULL)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      department = EXCLUDED.department,
      rating = EXCLUDED.rating,
      distance_km = EXCLUDED.distance_km,
      wait_minutes = EXCLUDED.wait_minutes,
      image = EXCLUDED.image,
      highlight = EXCLUDED.highlight;

-- Seed queue tokens (idempotent)
INSERT INTO public.queue_tokens (id, token, department, status, wait_minutes, emergency)
VALUES
  ('q-1','AM-021','General Medicine','Waiting',18,false),
  ('q-2','AM-022','Respiratory','Registered',26,false),
  ('q-3','AM-023','Neuro Care','File With Doctor',6,false),
  ('q-4','EM-004','Emergency','Your Turn',0,true)
ON CONFLICT (id) DO UPDATE
  SET token = EXCLUDED.token,
      department = EXCLUDED.department,
      status = EXCLUDED.status,
      wait_minutes = EXCLUDED.wait_minutes,
      emergency = EXCLUDED.emergency;

-- Optional: a tiny patients seed for the queued patients so relations exist
INSERT INTO public.patients (id, name)
VALUES
  ('p-q-1','Asha P.'),
  ('p-q-2','Rahul K.'),
  ('p-q-3','Zoya S.'),
  ('p-q-4','Emergency')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Link the queue_tokens to patients by id (best-effort - will only update where patient ids match)
UPDATE public.queue_tokens qt
SET patient_id = p.id
FROM public.patients p
WHERE (qt.id = 'q-1' AND p.id = 'p-q-1')
   OR (qt.id = 'q-2' AND p.id = 'p-q-2')
   OR (qt.id = 'q-3' AND p.id = 'p-q-3')
   OR (qt.id = 'q-4' AND p.id = 'p-q-4');

-- Create AI demo logs table (for demo only)
CREATE TABLE IF NOT EXISTS public.ai_demo_logs (
  id serial PRIMARY KEY,
  prompt text NOT NULL,
  response text,
  model text,
  created_at timestamptz DEFAULT now()
);

-- Done
SELECT 'OK' AS result;
