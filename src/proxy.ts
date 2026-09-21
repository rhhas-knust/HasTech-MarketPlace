import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { VISITOR_ID_COOKIE } from "@/lib/constants";

// Next.js 16 renamed the `middleware` file convention to `proxy` (it always
// runs on the nodejs runtime now, not edge). This refreshes the Supabase
// auth session cookie on every request so server components always see an
// up-to-date session -- see https://supabase.com/docs/guides/auth/server-side/nextjs.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching getUser() is what actually triggers a token refresh when the
  // access token is stale; getSession() alone would not.
  await supabase.auth.getUser();

  // A random, anonymous visitor id (no PII) used only for view-count
  // deduplication and coarse analytics -- see record_product_view in
  // 0009_functions_triggers.sql. Server Components can't set cookies
  // themselves, so it's minted here on first visit.
  if (!request.cookies.get(VISITOR_ID_COOKIE)) {
    response.cookies.set(VISITOR_ID_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
