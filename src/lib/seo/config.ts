/**
 * Single source of truth for SEO configuration.
 * All page metadata should reference this config.
 */

import type { Metadata } from "next";

const SITE_NAME = "Bid Buddy";
const SITE_DESCRIPTION =
  "AI-powered Upwork freelancer management — analyze jobs, generate proposals, and manage projects smarter.";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const seoConfig = {
  siteName: SITE_NAME,
  siteDescription: SITE_DESCRIPTION,
  siteUrl: SITE_URL,
} as const;

export function createMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}

/**
 * Creates page-specific metadata.
 */
export function createPageMetadata(
  title: string,
  description?: string
): Metadata {
  return {
    title,
    description: description ?? SITE_DESCRIPTION,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: description ?? SITE_DESCRIPTION,
    },
  };
}

