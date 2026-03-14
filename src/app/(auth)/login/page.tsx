/**
 * Login Page – server component that reads searchParams and
 * delegates rendering to the client LoginForm.
 *
 * If the user already has a valid session, redirect to dashboard
 * (or the callbackUrl) immediately, without rendering the form.
 */

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo/config";
import { LoginForm } from "@/components/modules/auth/login-form";
import { getServerSession } from "@/server/auth/get-session";

export const metadata: Metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to Bid Buddy with your GitHub account",
});

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    correlationId?: string;
    callbackUrl?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, session] = await Promise.all([searchParams, getServerSession()]);

  // Valid session → skip the login form and send the user where they wanted to go.
  if (session) {
    const destination = params.callbackUrl ?? "/dashboard";
    // Ensure the callbackUrl is a relative path to prevent open-redirect attacks.
    const safeDest = destination.startsWith("/") ? destination : "/dashboard";
    redirect(safeDest);
  }

  return (
    <LoginForm
      error={params.error}
      correlationId={params.correlationId}
    />
  );
}

