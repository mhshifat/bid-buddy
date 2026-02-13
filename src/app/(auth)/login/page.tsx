/**
 * Login Page – server component that reads searchParams and
 * delegates rendering to the client LoginForm.
 */

import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo/config";
import { LoginForm } from "@/components/modules/auth/login-form";

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
  const params = await searchParams;

  return (
    <LoginForm
      error={params.error}
      correlationId={params.correlationId}
    />
  );
}

