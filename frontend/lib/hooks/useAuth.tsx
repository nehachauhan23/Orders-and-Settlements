"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/types";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(({ user }) => {
        if (!cancelled) {
          setUser(user);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await authApi.login({ email, password });
      setUser(user);
      setStatus("authenticated");
      router.push("/dashboard");
    },
    [router]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { user } = await authApi.signup({ name, email, password });
      setUser(user);
      setStatus("authenticated");
      router.push("/dashboard");
    },
    [router]
  );

 const logout = useCallback(async () => {
  try {
    await authApi.logout();
  } finally {
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }
}, [router]);


  return (
    <AuthContext.Provider value={{ user, status, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
