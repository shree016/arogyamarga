type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function fetchOpenAIFollowUps(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a medical intake assistant. Ask 3 to 5 concise follow-up questions. Return one question per line. If a question has fixed choices, include them in parentheses like (Yes / No) or (Mild / Moderate / Severe). Do not add numbering or extra commentary.",
        },
        { role: "user", content: prompt },
      ] as OpenAIMessage[],
      max_tokens: 120,
      temperature: 0.4,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const responseText = Array.isArray(content)
    ? content.join("\n")
    : String(content);

  // Best-effort persist to ai_demo_logs (do not throw)
  try {
    const { supabaseAdmin } = await import("./supabase");
    if (supabaseAdmin && typeof supabaseAdmin.from === "function") {
      supabaseAdmin.from("ai_demo_logs").insert({
        prompt,
        response: responseText,
        model,
      });
    }
  } catch {
    // ignore logging errors
  }

  const followUps = content
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);

  return { raw: responseText, followUps, model };
}

export async function fetchOpenAIDecision(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = "gpt-4o-mini";
  const system =
    "You are a medical triage assistant. Given a patient's symptoms and follow-up answers, recommend the most appropriate department or specialist to consult and provide a concise next-step plan. Keep the response short, practical, and easy to present to a patient. Start with a brief title line.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.2,
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const responseText = Array.isArray(content)
    ? content.join("\n")
    : String(content);

  try {
    const { supabaseAdmin } = await import("./supabase");
    if (supabaseAdmin && typeof supabaseAdmin.from === "function") {
      await supabaseAdmin.from("ai_demo_logs").insert({
        prompt,
        response: responseText,
        model,
        type: "decision",
      });
    }
  } catch {
    // ignore logging errors
  }

  return { raw: responseText, model };
}
