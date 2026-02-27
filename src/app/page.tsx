/**
 * Root page – landing page for all visitors.
 * Logged-in users see a "Dashboard" link in the nav instead of "Sign In / Get Started".
 */

import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo/config";
import { getServerSession } from "@/server/auth/get-session";
import { LandingPage } from "@/components/modules/landing/landing-page";

export const metadata: Metadata = createMetadata({
  title: "Bid Buddy — AI-Powered Upwork Assistant",
  description:
    "Win more Upwork contracts with AI job analysis, instant proposal generation, smart auto-scan, and a browser extension that works while you browse.",
});

export default async function Home() {
  const session = await getServerSession();

  return <LandingPage isLoggedIn={!!session} />;
}
