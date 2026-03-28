import React, { createContext, useContext, useState, useEffect } from "react";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in (from session storage)
  useEffect(() => {
    const storedUser = sessionStorage.getItem("adminUser");
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored admin user:", error);
        sessionStorage.removeItem("adminUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Call backend login endpoint
      const response = await fetch("/api/trpc/admin.login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "admin.login",
          params: { input: { username, password } },
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Login failed");
      }

      const user = data.result.data;
      setAdminUser(user);
      sessionStorage.setItem("adminUser", JSON.stringify(user));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    sessionStorage.removeItem("adminUser");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isLoading,
        login,
        logout,
        isAuthenticated: !!adminUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
