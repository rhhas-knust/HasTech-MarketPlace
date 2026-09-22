import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PLATFORM_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: PLATFORM_NAME,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description:
    "Create and run a professional online store: products, orders, payments and analytics in one place.",
  verification: {
    // Confirms ownership of hastech-marketplace.vercel.app for Google
    // Search Console. This renders the required
    // <meta name="google-site-verification" content="..."> tag -- the
    // correct method for a *.vercel.app subdomain, since we don't control
    // vercel.app's own DNS to add a TXT record.
    google: "P-7TuM-5UjdIaOBDV1_NwQ2y67_dlQB3Q4t6fii3Rr4",
  },
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("hastech-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme-init script below sets data-theme on this element before
      // React hydrates, deliberately diverging from the server-rendered
      // markup (which can't know the visitor's saved preference) --
      // suppressHydrationWarning tells React this specific, expected
      // mismatch is fine rather than logging it as a bug.
      suppressHydrationWarning
    >
      <head>
        {/* Applies a previously-saved theme choice before first paint, so
            there's no flash of the wrong theme while React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-(--color-surface-subtle)">{children}</body>
    </html>
  );
}
