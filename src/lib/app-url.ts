import "server-only";
import { headers } from "next/headers";

/** Falls back to the current request's host when NEXT_PUBLIC_APP_URL isn't set (e.g. preview deployments). */
export async function getAppUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
