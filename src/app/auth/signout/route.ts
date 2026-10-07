import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 303 See Other, not NextResponse.redirect's default 307: a 307 makes the
// browser repeat the POST against /login, and a page answers that with 405.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?signedOut=1", request.url), 303);
}

// Visiting the URL directly (old bookmark, typed address) shouldn't show an
// error either. It doesn't sign out, since a GET can be triggered by any page.
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
