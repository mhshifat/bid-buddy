/**
 * Client-side Authentication Context.
 *
 * Provides the current user, loading state, and logout functionality
 * to all client components via React Context.
 *
 * Usage:
 *   const { user, isLoading, logout } = useAuth();
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types (client-safe – no Prisma imports)
// ---------------------------------------------------------------------------

export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
  /** Optionally pre-populate user from a server component. */
  initialUser?: AuthUser | null;
}

export function AuthProvider({
  children,
  initialUser = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const router = useRouter();
  const pathname = usePathname();

  const redirectToLogin = useCallback(() => {
    if (pathname === "/login") return;
    const loginUrl = new URL("/login", window.location.origin);
    if (pathname) {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    router.replace(loginUrl.pathname + loginUrl.search);
  }, [router, pathname]);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/session");

      if (response.ok) {
        const json = (await response.json()) as {
          success: boolean;
          data: { user: AuthUser };
        };
        if (json.success) {
          setUser(json.data.user);
        } else {
          setUser(null);
          redirectToLogin();
        }
      } else {
        setUser(null);
        redirectToLogin();
      }
    } catch {
      setUser(null);
      redirectToLogin();
    } finally {
      setIsLoading(false);
    }
  }, [redirectToLogin]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  // Fetch session on mount if no initial user was provided
  useEffect(() => {
    if (!initialUser) {
      refreshSession();
    }
  }, [initialUser, refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current authentication state.
 * Must be called within an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return context;
}

