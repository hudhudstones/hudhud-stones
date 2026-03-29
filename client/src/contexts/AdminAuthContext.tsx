import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AdminUser {
  id: string;
  username: string;
  role: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("adminUser");
    const storedToken = localStorage.getItem("authToken");
    if (storedUser && storedToken) {
      try {
        setAdminUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse stored admin user", e);
        localStorage.removeItem("adminUser");
        localStorage.removeItem("authToken");
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trpc/admin.login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Login failed");
      }

      const { user, token: newToken } = data.data;
      setAdminUser(user);
      setToken(newToken);
      localStorage.setItem("adminUser", JSON.stringify(user));
      localStorage.setItem("authToken", newToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    setToken(null);
    localStorage.removeItem("adminUser");
    localStorage.removeItem("authToken");
  };

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, isLoading, error, login, logout, token }}
    >
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
