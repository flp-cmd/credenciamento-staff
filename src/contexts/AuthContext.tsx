"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/lib/api-client";

interface Admin {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    if (typeof window !== "undefined") {
      const storedAdmin = localStorage.getItem("adminData");
      return storedAdmin ? JSON.parse(storedAdmin) : null;
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminToken");
    }
    return null;
  });
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{ admin: Admin; token: string }>(
      "/api/admin/login",
      { email, password }
    );

    if (response.error) {
      return { success: false, error: response.error };
    }

    if (response.data) {
      setToken(response.data.token);
      setAdmin(response.data.admin);
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminData", JSON.stringify(response.data.admin));
      router.push("/dashboard");
      return { success: true };
    }

    return { success: false, error: "Unknown error" };
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
