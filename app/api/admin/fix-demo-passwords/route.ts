import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time endpoint to reset all seeded demo user passwords via the admin API.
// Looks up real UUIDs from the profiles table (bypasses broken listUsers),
// then calls updateUserById with the correct IDs.
// Visit GET /api/admin/fix-demo-passwords once to fix all demo logins.

const DEMO_USERS = [
  { email: "adm001@arogyamaarga.in",       password: "Admin@123"    },
  { email: "dt101@arogyamaarga.in",        password: "Doctor@123"   },
  { email: "dt102@arogyamaarga.in",        password: "Doctor@123"   },
  { email: "dt103@arogyamaarga.in",        password: "Doctor@123"   },
  { email: "dt104@arogyamaarga.in",        password: "Doctor@123"   },
  { email: "dt105@arogyamaarga.in",        password: "Doctor@123"   },
  { email: "st101@arogyamaarga.in",        password: "Staff@123"    },
  { email: "st102@arogyamaarga.in",        password: "Staff@123"    },
  { email: "pt0001@guest.arogyamaarga.in", password: "Patient@0001" },
  { email: "pt0002@guest.arogyamaarga.in", password: "Patient@0002" },
  { email: "pt0003@guest.arogyamaarga.in", password: "Patient@0003" },
  { email: "pt0004@guest.arogyamaarga.in", password: "Patient@0004" },
  { email: "pt0005@guest.arogyamaarga.in", password: "Patient@0005" },
];

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const admin = createClient(url, key, { auth: { persistSession: false } });

  // Step 1: look up real UUIDs from the profiles table (avoids broken listUsers)
  const emails = DEMO_USERS.map((u) => u.email);
  const { data: profileRows, error: profileErr } = await admin
    .from("profiles")
    .select("id, email")
    .in("email", emails);

  if (profileErr) {
    return NextResponse.json(
      { error: `profiles lookup failed: ${profileErr.message}` },
      { status: 500 },
    );
  }

  const idByEmail = new Map((profileRows ?? []).map((r: { id: string; email: string }) => [r.email, r.id]));

  const results: { email: string; action: string; ok: boolean; error?: string }[] = [];

  for (const u of DEMO_USERS) {
    const uid = idByEmail.get(u.email);

    if (!uid) {
      results.push({ email: u.email, action: "skipped — not in profiles", ok: false });
      continue;
    }

    const { error } = await admin.auth.admin.updateUserById(uid, {
      password: u.password,
      email_confirm: true,
    });
    results.push({ email: u.email, action: "updated", ok: !error, error: error?.message });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { message: allOk ? "All demo passwords fixed ✓" : "Some updates failed", results },
    { status: allOk ? 200 : 207 },
  );
}
