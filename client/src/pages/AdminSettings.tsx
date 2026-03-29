import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<"users" | "dashboard">("users");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      // This would call a tRPC endpoint to create a new admin user
      // For now, we'll show a placeholder
      toast.success(`User "${newUsername}" would be created (feature pending backend)`);
      setNewUsername("");
      setNewPassword("");
    } catch (err) {
      toast.error("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-2">Manage admin accounts and dashboard configuration</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "users"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "dashboard"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Dashboard Settings
        </button>
      </div>

      {/* User Accounts Tab */}
      {activeTab === "users" && (
        <div className="grid gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Create New Admin User</CardTitle>
              <CardDescription>Add a new administrator account to manage the store</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={loading}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="bg-background border-border"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? "Creating..." : "Create Admin User"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Existing Admin Users</CardTitle>
              <CardDescription>Manage current administrator accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg border border-border flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">admin</p>
                    <p className="text-xs text-muted-foreground">Default admin account</p>
                  </div>
                  <Button variant="outline" disabled>
                    Default
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Settings Tab */}
      {activeTab === "dashboard" && (
        <div className="grid gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Dashboard Configuration</CardTitle>
              <CardDescription>Customize dashboard appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Items per page
                </label>
                <Input
                  type="number"
                  placeholder="20"
                  defaultValue="20"
                  min="5"
                  max="100"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">Number of items to display in tables</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Auto-refresh interval (seconds)
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  defaultValue="30"
                  min="5"
                  max="300"
                  className="bg-background border-border"
                />
                <p className="text-xs text-muted-foreground">How often to refresh data automatically</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">Show order notifications</span>
                </label>
                <p className="text-xs text-muted-foreground">Display alerts for new orders</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground">Show low stock warnings</span>
                </label>
                <p className="text-xs text-muted-foreground">Alert when product stock is low</p>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2">
                <span className="text-sm text-muted-foreground">App Version</span>
                <span className="text-sm font-medium text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-foreground">Connected</span>
              </div>
              <div className="flex justify-between items-center p-2">
                <span className="text-sm text-muted-foreground">Last Backup</span>
                <span className="text-sm font-medium text-foreground">Today at 2:30 AM</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
