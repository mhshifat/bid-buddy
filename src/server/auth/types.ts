/**
 * Authentication types used across the auth system.
 * All properties use camelCase per project conventions.
 */

export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

/**
 * Authenticated user representation for the application layer.
 */
export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
}

/**
 * Session representation for the application layer.
 */
export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

/**
 * Combined session + user data returned after session validation.
 */
export interface SessionWithUser {
  session: AuthSession;
  user: AuthUser;
}

/**
 * OAuth token exchange result.
 */
export interface OAuthTokenResult {
  accessToken: string;
  tokenType: string;
  scope: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Normalized user profile from any OAuth provider.
 */
export interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Configuration for an OAuth provider.
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Metadata about the request (for session tracking).
 */
export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

