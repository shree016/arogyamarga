import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

type DoctorRow = {
  id: string;
  specialty: string;
  department: string;
  rating: number;
  room_number: string | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

type DecisionResult = {
  recommendation: string;
  department: string;
  doctorName: string;
  doctorId: string | null;
  urgency: string;
  triageScore: number;
  estimatedWaitMinutes: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      symptoms?: string;
      answers?: Record<string, string>;
      patientName?: string;
      patientAge?: string;
      patientGender?: string;
    };

    const { symptoms, answers = {}, patientName, patientAge, patientGender } = body;

    if (!symptoms?.trim()) {
      return NextResponse.json({ error: "Symptoms required" }, { status: 400 });
    }

    const admin = getAdmin();

    // Fetch all available doctors with their names
    const { data: doctors } = (await admin
      .from("doctor_profiles")
      .select("id, specialty, department, rating, room_number, profiles!inner(full_name)")
      .eq("is_available", true)) as { data: DoctorRow[] | null };

    const doctorLines = (doctors ?? []).map((d) => {
      const prof = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      const room = d.room_number ? `, Room ${d.room_number}` : "";
      return `- ${prof?.full_name}: ${d.specialty} (${d.department}${room})`;
    });

    const systemPrompt = `You are a hospital triage AI. Given a patient's symptoms and follow-up answers, pick the single most appropriate doctor from the list below and output a JSON object.

Available doctors:
${doctorLines.join("\n")}

Respond ONLY with this JSON (no markdown, no extra text):
{
  "recommendation": "<2-3 sentence patient-friendly guidance on what to do next>",
  "department": "<department name exactly as shown above>",
  "doctorName": "<doctor full name exactly as shown above>",
  "urgency": "<Safe | Moderate | Emergency>",
  "triageScore": <integer 1-5>,
  "estimatedWaitMinutes": <integer>
}

triageScore guide: 1=very safe, 2=safe, 3=moderate, 4=urgent, 5=emergency
estimatedWaitMinutes guide: Emergency=0, Urgent=5, Moderate=15-25, Safe=30-45`;

    const userContent = [
      patientName ? `Patient: ${patientName}` : null,
      patientAge ? `Age: ${patientAge}` : null,
      patientGender ? `Gender: ${patientGender}` : null,
      `Chief complaint: ${symptoms}`,
      Object.keys(answers).length
        ? `Follow-up answers:\n${Object.entries(answers)
            .map(([q, a]) => `- ${q}: ${a}`)
            .join("\n")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(buildFallback(symptoms, doctors ?? []));
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 350,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(buildFallback(symptoms, doctors ?? []));
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      return NextResponse.json(buildFallback(symptoms, doctors ?? []));
    }

    const doctorName = String(parsed.doctorName ?? "");
    const department = String(parsed.department ?? "General Medicine");

    // Match doctor by name, then by department, then first available
    const matchedDoctor =
      (doctors ?? []).find((d) => {
        const prof = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
        return prof?.full_name === doctorName;
      }) ??
      (doctors ?? []).find((d) => d.department === department) ??
      (doctors ?? [])[0] ??
      null;

    const resolvedName = (() => {
      if (!matchedDoctor) return doctorName;
      const prof = Array.isArray(matchedDoctor.profiles)
        ? matchedDoctor.profiles[0]
        : matchedDoctor.profiles;
      return prof?.full_name ?? doctorName;
    })();

    return NextResponse.json({
      recommendation: String(parsed.recommendation ?? "Please proceed to the recommended department."),
      department,
      doctorName: resolvedName,
      doctorId: matchedDoctor?.id ?? null,
      urgency: String(parsed.urgency ?? "Moderate"),
      triageScore: Number(parsed.triageScore ?? 3),
      estimatedWaitMinutes: Number(parsed.estimatedWaitMinutes ?? 25),
    } satisfies DecisionResult);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

function buildFallback(symptoms: string, doctors: DoctorRow[]): DecisionResult {
  const lower = symptoms.toLowerCase();
  let dept = "General Medicine";
  if (/knee|joint|bone|fracture|back|spine/.test(lower)) dept = "Orthopedics";
  else if (/head|migraine|neuro|seizure|dizziness/.test(lower)) dept = "Neuro Care";
  else if (/breath|lung|asthma|cough|wheez/.test(lower)) dept = "Respiratory";
  else if (/stomach|digest|nausea|bowel|abdomen|vomit/.test(lower)) dept = "Digestive Health";

  const matched =
    doctors.find((d) => d.department === dept) ?? doctors[0] ?? null;
  const prof = matched
    ? Array.isArray(matched.profiles)
      ? matched.profiles[0]
      : matched.profiles
    : null;

  return {
    recommendation: `Based on your symptoms, we recommend consulting the ${dept} department.`,
    department: dept,
    doctorName: prof?.full_name ?? "Dr. Rohan Mehta",
    doctorId: matched?.id ?? null,
    urgency: "Moderate",
    triageScore: 3,
    estimatedWaitMinutes: 25,
  };
}
