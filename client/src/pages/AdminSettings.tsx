import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Trash2, Edit2, Save, X, Power, Lock } from "lucide-react";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<"users" | "dashboard">("users");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingPassword, setEditingPassword] = useState("");
  const [editingUsername, setEditingUsername] = useState("");
  const [editMode, setEditMode] = useState<"password" | "username" | null>(null);

  // Fetch existing users
  const { data: users, isLoading: usersLoading, refetch } = trpc.admin.listUsers.useQuery();
  const createUserMutation = trpc.admin.createUser.useMutation();
  const updatePasswordMutation = trpc.admin.updatePassword.useMutation();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();
  const changeUsernameMutation = trpc.admin.changeUsername.useMutation();
  const toggleStatusMutation = trpc.admin.toggleStatus.useMutation();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      await createUserMutation.mutateAsync({
        username: newUsername,
        password: newPassword,
        email: newEmail || undefined,
      });
      toast.success(`User "${newUsername}" created successfully`);
      setNewUsername("");
      setNewPassword("");
      setNewEmail("");
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (userId: number) => {
    if (!editingPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (editingPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        userId,
        newPassword: editingPassword,
      });
      toast.success("Password updated successfully");
      setEditingUserId(null);
      setEditingPassword("");
      setEditMode(null);
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update password";
      toast.error(errorMessage);
    }
  };

  const handleChangeUsername = async (userId: number) => {
    if (!editingUsername.trim()) {
      toast.error("Please enter a new username");
      return;
    }

    try {
      await changeUsernameMutation.mutateAsync({
        userId,
        newUsername: editingUsername,
      });
      toast.success("Username changed successfully");
      setEditingUserId(null);
      setEditingUsername("");
      setEditMode(null);
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to change username";
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: number | null) => {
    try {
      const result = await toggleStatusMutation.mutateAsync({ userId });
      toast.success(result.message);
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle user status";
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync({ userId });
      toast.success("User deleted successfully");
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(errorMessage);
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
                    placeholder="Enter password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email (Optional)
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
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
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading users...</p>
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user: any) => (
                    <div key={user.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded font-medium ${user.is_active ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      {editingUserId === user.id && editMode === "password" ? (
                        <div className="space-y-2">
                          <Input
                            type="password"
                            placeholder="Enter new password (min 6 characters)"
                            value={editingPassword}
                            onChange={(e) => setEditingPassword(e.target.value)}
                            className="bg-background border-border"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePassword(user.id)}
                              className="flex-1 bg-primary hover:bg-primary/90"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserId(null);
                                setEditingPassword("");
                                setEditMode(null);
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : editingUserId === user.id && editMode === "username" ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            placeholder="Enter new username"
                            value={editingUsername}
                            onChange={(e) => setEditingUsername(e.target.value)}
                            className="bg-background border-border"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleChangeUsername(user.id)}
                              className="flex-1 bg-primary hover:bg-primary/90"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUserId(null);
                                setEditingUsername("");
                                setEditMode(null);
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUserId(user.id);
                              setEditingUsername(user.username);
                              setEditMode("username");
                            }}
                            className="flex-1"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Change Username
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUserId(user.id);
                              setEditingPassword("");
                              setEditMode("password");
                            }}
                            className="flex-1"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_active ? "outline" : "default"}
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={user.is_active ? "" : "bg-green-600 hover:bg-green-700"}
                          >
                            <Power className="w-4 h-4 mr-2" />
                            {user.is_active ? "Disable" : "Enable"}
                          </Button>
                          {users.length > 1 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
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
