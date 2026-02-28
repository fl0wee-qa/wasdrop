import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { RegionBootstrap } from "@/components/layout/region-bootstrap";
import { startInAppJobs } from "@/lib/jobs/runner";
import { getAuthSession } from "@/lib/auth";
import { resolveCountry } from "@/lib/services/user-preferences";

import "./globals.css";

const headingFont = Orbitron({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Rajdhani({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wasdrop.local"),
  title: {
    default: "WASDrop",
    template: "%s | WASDrop",
  },
  description:
    "WASDrop aggregates discounted PC game deals and gamer-focused industry news across major stores.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  startInAppJobs();

  const session = await getAuthSession();
  const country = await resolveCountry(session?.user?.id);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable} bg-background text-foreground antialiased`}>
        <AppProviders>
          <RegionBootstrap />
          <div className="hero-gradient relative min-h-screen">
            <Header country={country} />
            <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-40 md:px-6 md:pb-12 md:pt-44">{children}</main>
            <Footer />
            <CookieBanner />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

