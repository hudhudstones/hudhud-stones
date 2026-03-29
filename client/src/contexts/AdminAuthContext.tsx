import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "../lib/trpc";

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("adminUser");
    if (stored) {
      try {
        setAdminUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored admin user", e);
      }
    }
  }, []);

  // Use tRPC mutation hook
  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: (user) => {
      setAdminUser(user);
      sessionStorage.setItem("adminUser", JSON.stringify(user));
      setError(null);
    },
    onError: (error) => {
      setError(error.message || "Invalid username or password");
    },
  });

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({ username, password });
    } catch (err) {
      // Error is handled by mutation's onError
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    sessionStorage.removeItem("adminUser");
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, isLoading: isLoading || loginMutation.isPending, error, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};
