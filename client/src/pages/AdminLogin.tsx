import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BRAND } from "@shared/constants";

export default function AdminLogin() {
  const { login, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      await login(username, password);
      toast.success("Login successful!");
      setLocation("/admin");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <img src={BRAND.logo} alt="Hudhud Stones" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">{BRAND.name}</h1>
          <p className="text-muted-foreground mt-2">Admin Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-background border-border"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background border-border"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground font-medium mb-2">Demo Credentials:</p>
              <p className="text-xs text-muted-foreground">Username: <span className="font-mono">admin</span></p>
              <p className="text-xs text-muted-foreground">Password: <span className="font-mono">admin123</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
