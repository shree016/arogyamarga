import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; age?: string; gender?: string };
    const { name, age, gender } = body;

    if (!name?.trim() || !age || !gender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = getAdmin();

    // Find highest existing patient_id in patient_profiles
    const { data: existing, error: fetchError } = await admin
      .from("patient_profiles")
      .select("patient_id")
      .like("patient_id", "PT-%")
      .order("patient_id", { ascending: false })
      .limit(1);

    if (fetchError) {
      return NextResponse.json({ error: `DB fetch failed: ${fetchError.message}` }, { status: 500 });
    }

    const lastNum = existing?.[0]?.patient_id
      ? parseInt((existing[0].patient_id as string).replace("PT-", ""), 10)
      : 0;

    // Try sequential IDs until we find one whose email isn't already taken
    // (orphaned auth users from prior failed attempts can block the obvious next ID)
    let seq = lastNum + 1;
    let createdUserId: string | null = null;
    let patientId = "";
    let email = "";
    let password = "";

    for (let attempt = 0; attempt < 50; attempt++) {
      const padded = String(seq).padStart(4, "0");
      patientId = `PT-${padded}`;
      email = `pt${padded}@guest.arogyamaarga.in`;
      password = `Patient@${padded}`;

      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name.trim(), role: "Patient" },
      });

      if (!authError) {
        createdUserId = authData.user.id;
        break;
      }

      // Email already taken → try the next number
      if (authError.message.toLowerCase().includes("already")) {
        seq++;
        continue;
      }

      return NextResponse.json({ error: `Auth failed: ${authError.message}` }, { status: 500 });
    }

    if (!createdUserId) {
      return NextResponse.json({ error: "Could not generate a unique Patient ID. Please try again." }, { status: 500 });
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: createdUserId,
      role: "Patient",
      full_name: name.trim(),
      email,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(createdUserId);
      return NextResponse.json({ error: `Profile failed: ${profileError.message}` }, { status: 500 });
    }

    const { error: patientError } = await admin.from("patient_profiles").insert({
      id: createdUserId,
      patient_id: patientId,
      age: parseInt(age, 10),
      gender,
      patient_type: "OPD",
    });

    if (patientError) {
      await admin.auth.admin.deleteUser(createdUserId);
      return NextResponse.json({ error: `Patient profile failed: ${patientError.message}` }, { status: 500 });
    }

    return NextResponse.json({ patientId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
