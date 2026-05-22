import { createClient } from "@/lib/server";
import { type NextRequest, NextResponse } from "next/server";

// Server-side signout — properly clears the session cookie before redirecting.
// Called via window.location.href so the browser makes a fresh HTTP request
// and the middleware sees cleared cookies on the subsequent /login load.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}
