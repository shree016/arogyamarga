/**
 * ArogyaMaarga Seed Script
 *
 * PREREQUISITE: Run supabase/setup.sql in the Supabase SQL Editor first to:
 *   1. Create database tables
 *   2. Set up RLS policies
 *   3. Seed auth users and all data
 *
 * OR, if you prefer Node.js seeding, run this after creating the tables
 * manually in the Supabase SQL Editor (run only schema.sql first).
 *
 * Run: node scripts/seed.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Fixed UUIDs matching setup.sql
const IDS = {
  admin: "00000000-0000-0000-0000-000000000001",
  doc1: "00000000-0000-0000-0000-000000000002",
  doc2: "00000000-0000-0000-0000-000000000003",
  doc3: "00000000-0000-0000-0000-000000000004",
  doc4: "00000000-0000-0000-0000-000000000005",
  doc5: "00000000-0000-0000-0000-000000000006",
  staff1: "00000000-0000-0000-0000-000000000007",
  staff2: "00000000-0000-0000-0000-000000000008",
  patient1: "00000000-0000-0000-0000-000000000009",
  patient2: "00000000-0000-0000-0000-000000000010",
  patient3: "00000000-0000-0000-0000-000000000011",
  patient4: "00000000-0000-0000-0000-000000000012",
  patient5: "00000000-0000-0000-0000-000000000013",
};

const USERS = [
  { id: IDS.admin,    email: "adm001@arogyamaarga.in", password: "Admin@123",  role: "Super Admin",  full_name: "Dr. Suresh Kumar", phone: "+91 98765 00001" },
  { id: IDS.doc1,     email: "dt101@arogyamaarga.in",  password: "Doctor@123", role: "Doctor",       full_name: "Dr. Aarav Iyer",   phone: "+91 98765 00002", doctor: { doctor_id: "DT101", specialty: "Orthopedics",       department: "Orthopedics",     qualification: "MBBS, MS (Ortho), FRCS",   experience_years: 14, rating: 4.8, consultation_fee: 800,  room_number: "OPD-201" } },
  { id: IDS.doc2,     email: "dt102@arogyamaarga.in",  password: "Doctor@123", role: "Doctor",       full_name: "Dr. Anika Rao",    phone: "+91 98765 00003", doctor: { doctor_id: "DT102", specialty: "Neurology",         department: "Neuro Care",      qualification: "MBBS, MD (Neuro), DM",     experience_years: 11, rating: 4.9, consultation_fee: 1000, room_number: "OPD-301" } },
  { id: IDS.doc3,     email: "dt103@arogyamaarga.in",  password: "Doctor@123", role: "Doctor",       full_name: "Dr. Rohan Mehta",  phone: "+91 98765 00004", doctor: { doctor_id: "DT103", specialty: "Internal Medicine", department: "General Medicine",qualification: "MBBS, MD (Medicine)",      experience_years: 8,  rating: 4.7, consultation_fee: 600,  room_number: "OPD-101" } },
  { id: IDS.doc4,     email: "dt104@arogyamaarga.in",  password: "Doctor@123", role: "Doctor",       full_name: "Dr. Kavya Nair",   phone: "+91 98765 00005", doctor: { doctor_id: "DT104", specialty: "Pulmonology",       department: "Respiratory",     qualification: "MBBS, MD (Pulmonology)",   experience_years: 9,  rating: 4.8, consultation_fee: 700,  room_number: "OPD-401" } },
  { id: IDS.doc5,     email: "dt105@arogyamaarga.in",  password: "Doctor@123", role: "Doctor",       full_name: "Dr. Vihaan Das",   phone: "+91 98765 00006", doctor: { doctor_id: "DT105", specialty: "Gastroenterology",  department: "Digestive Health",qualification: "MBBS, MD, DM (Gastro)",    experience_years: 12, rating: 4.6, consultation_fee: 900,  room_number: "OPD-501" } },
  { id: IDS.staff1,   email: "st101@arogyamaarga.in",  password: "Staff@123",  role: "Receptionist", full_name: "Priya Sharma",     phone: "+91 98765 00007", staff: { staff_id: "ST101", department: "Front Desk", shift: "Morning", employee_id: "EMP-001" } },
  { id: IDS.staff2,   email: "st102@arogyamaarga.in",  password: "Staff@123",  role: "Receptionist", full_name: "Ravi Kumar",       phone: "+91 98765 00008", staff: { staff_id: "ST102", department: "Emergency",  shift: "Evening", employee_id: "EMP-002" } },
  { id: IDS.patient1, email: "pt0001@guest.arogyamaarga.in", password: "Patient@0001", role: "Patient", full_name: "Anaya Kulkarni",  phone: "+91 98765 10001", patient: { patient_id: "PT-0001", age: 28, gender: "Female", blood_group: "B+",  patient_type: "OPD",          date_of_birth: "1996-04-15", address: "12, MG Road",    city: "Bengaluru", medical_history: ["Seasonal allergies", "Mild asthma"],          allergies: ["Penicillin"],  emergency_contact_name: "Ravi Kulkarni",  emergency_contact_phone: "+91 98765 10099" } },
  { id: IDS.patient2, email: "pt0002@guest.arogyamaarga.in", password: "Patient@0002", role: "Patient", full_name: "Arjun Sharma",    phone: "+91 98765 10002", patient: { patient_id: "PT-0002", age: 45, gender: "Male",   blood_group: "O+",  patient_type: "IPD",          date_of_birth: "1979-08-22", address: "45, Indiranagar", city: "Bengaluru", medical_history: ["Hypertension", "Type-2 Diabetes"],            allergies: [],              emergency_contact_name: "Sunita Sharma",  emergency_contact_phone: "+91 98765 10098", insurance_id: "INS-2024-00456" } },
  { id: IDS.patient3, email: "pt0003@guest.arogyamaarga.in", password: "Patient@0003", role: "Patient", full_name: "Zoya Siddiqui",   phone: "+91 98765 10003", patient: { patient_id: "PT-0003", age: 32, gender: "Female", blood_group: "A+",  patient_type: "Telemedicine", date_of_birth: "1992-11-05", address: "78, Koramangala", city: "Bengaluru", medical_history: ["Migraine"],                                   allergies: ["Aspirin"],     emergency_contact_name: "Faiz Siddiqui",  emergency_contact_phone: "+91 98765 10097" } },
  { id: IDS.patient4, email: "pt0004@guest.arogyamaarga.in", password: "Patient@0004", role: "Patient", full_name: "Rahul Nair",      phone: "+91 98765 10004", patient: { patient_id: "PT-0004", age: 62, gender: "Male",   blood_group: "AB+", patient_type: "Referral",     date_of_birth: "1962-03-10", address: "22, Jayanagar",  city: "Bengaluru", medical_history: ["Coronary Artery Disease", "High Cholesterol"], allergies: ["Sulfa drugs"], emergency_contact_name: "Meera Nair",     emergency_contact_phone: "+91 98765 10096", referred_by: "Dr. Vijay Menon, City General Hospital" } },
  { id: IDS.patient5, email: "pt0005@guest.arogyamaarga.in", password: "Patient@0005", role: "Patient", full_name: "Priya Venkatesh", phone: "+91 98765 10005", patient: { patient_id: "PT-0005", age: 35, gender: "Female", blood_group: "O-",  patient_type: "Emergency",    date_of_birth: "1989-07-19", address: "90, HSR Layout", city: "Bengaluru", medical_history: [],                                             allergies: [],              emergency_contact_name: "Siva Venkatesh", emergency_contact_phone: "+91 98765 10095" } },
];

async function checkTablesExist() {
  const { error } = await admin.from("profiles").select("id").limit(1);
  return !error;
}

async function deleteAllData() {
  console.log("🗑️  Cleaning existing data...");
  await admin.from("appointments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("triage_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("queue_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("staff_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("patient_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("doctor_profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  for (const user of existingUsers?.users ?? []) {
    await admin.auth.admin.deleteUser(user.id);
  }
  console.log("✅ Cleaned.\n");
}

async function createUser(userData) {
  const { id, email, password, role, full_name, phone, doctor, patient, staff } = userData;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (authError) {
    console.error(`  ❌ Auth error for ${email}:`, authError.message);
    return null;
  }

  const userId = authData.user.id;
  const { error: profileError } = await admin.from("profiles").insert({ id: userId, role, full_name, email, phone: phone ?? null });
  if (profileError) { console.error(`  ❌ Profile error:`, profileError.message); return null; }

  if (role === "Doctor" && doctor) {
    const { error } = await admin.from("doctor_profiles").insert({ id: userId, ...doctor });
    if (error) console.error(`  ❌ Doctor profile:`, error.message);
  }
  if (role === "Patient" && patient) {
    // eslint-disable-next-line no-unused-vars
    const { referred_by, ...patientCore } = patient;
    const { error } = await admin.from("patient_profiles").insert({ id: userId, ...patientCore });
    if (error) console.error(`  ❌ Patient profile:`, error.message);
    else if (referred_by) {
      await admin.from("patient_profiles").update({ referred_by }).eq("id", userId);
    }
  }
  if (role === "Receptionist" && staff) {
    const { error } = await admin.from("staff_profiles").insert({ id: userId, ...staff });
    if (error) console.error(`  ❌ Staff profile:`, error.message);
  }

  return userId;
}

async function seedQueue(userIdMap) {
  console.log("📋 Seeding queue entries...");
  const { data: doctors } = await admin.from("doctor_profiles").select("id, department").limit(5);
  const docByDept = {};
  for (const d of doctors ?? []) docByDept[d.department] = d.id;

  const entries = [
    { email: "anaya.kulkarni@gmail.com", token: "AM-021", department: "General Medicine", status: "Waiting", patient_type: "OPD", symptoms: "Headache and mild fever since morning", triage_score: 3, triage_urgency: "Moderate", wait_minutes: 18, is_emergency: false },
    { email: "arjun.sharma@gmail.com", token: "AM-022", department: "General Medicine", status: "File With Doctor", patient_type: "IPD", symptoms: "Blood sugar spike, feeling dizzy", triage_score: 4, triage_urgency: "Moderate", wait_minutes: 6, is_emergency: false },
    { email: "zoya.siddiqui@gmail.com", token: "AM-023", department: "Neuro Care", status: "Registered", patient_type: "Telemedicine", symptoms: "Severe migraine with nausea", triage_score: 3, triage_urgency: "Moderate", wait_minutes: 24, is_emergency: false },
    { email: "priya.venkatesh@gmail.com", token: "EM-001", department: "Emergency", status: "Your Turn", patient_type: "Emergency", symptoms: "Chest pain, shortness of breath", triage_score: 5, triage_urgency: "Emergency", wait_minutes: 0, is_emergency: true },
    { email: "rahul.nair@gmail.com", token: "AM-024", department: "General Medicine", status: "Registered", patient_type: "Referral", symptoms: "Follow-up for cardiac evaluation", triage_score: 3, triage_urgency: "Moderate", wait_minutes: 32, is_emergency: false },
  ];

  for (const entry of entries) {
    const patientId = userIdMap[entry.email];
    if (!patientId) { console.log(`  ⚠️  Patient not found: ${entry.email}`); continue; }
    const { error } = await admin.from("queue_entries").insert({
      patient_id: patientId,
      token: entry.token,
      department: entry.department,
      doctor_id: docByDept[entry.department] ?? null,
      status: entry.status,
      patient_type: entry.patient_type,
      is_emergency: entry.is_emergency,
      symptoms: entry.symptoms,
      triage_score: entry.triage_score,
      triage_urgency: entry.triage_urgency,
      wait_minutes: entry.wait_minutes,
    });
    if (error) console.error(`  ❌ Queue error:`, error.message);
    else console.log(`  ✅ Queue: ${entry.token} (${entry.email})`);
  }
}

async function main() {
  console.log("🌱 ArogyaMaarga Seed Script\n");

  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    console.error("❌ Database tables not found!");
    console.error("Please run supabase/setup.sql in the Supabase SQL Editor first:");
    console.error("  https://supabase.com/dashboard/project/_/sql\n");
    process.exit(1);
  }

  await deleteAllData();

  console.log("👤 Creating users...");
  const userIdMap = {};
  for (const userData of USERS) {
    const userId = await createUser(userData);
    if (userId) {
      userIdMap[userData.email] = userId;
      console.log(`  ✅ ${userData.full_name} (${userData.role})`);
    }
  }

  await seedQueue(userIdMap);

  console.log("\n🎉 Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Demo Credentials (login with ID + password):");
  console.log("  Admin:   ID ADM001  / Admin@123");
  console.log("  Doctor:  ID DT101   / Doctor@123");
  console.log("  Staff:   ID ST101   / Staff@123");
  console.log("  Patient: ID PT-0001 / Patient@0001  (returning patient demo)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
