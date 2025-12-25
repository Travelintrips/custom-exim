import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Mail,
  User as UserIcon,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserRole } from "@/hooks/useRole";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

const roleLabels: Record<UserRole, string> = {
  export_staff: "Export Staff",
  import_staff: "Import Staff",
  finance: "Finance",
  viewer: "Viewer",
  super_admin: "Super Admin",
};

const roleBadgeColors: Record<UserRole, string> = {
  export_staff: "bg-blue-100 text-blue-800",
  import_staff: "bg-purple-100 text-purple-800",
  finance: "bg-emerald-100 text-emerald-800",
  viewer: "bg-slate-100 text-slate-800",
  super_admin: "bg-amber-100 text-amber-800",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "viewer" as UserRole,
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map user_roles to User interface
      const mappedUsers: User[] = (data || []).map((item) => ({
        id: item.id,
        email: item.email || "",
        full_name: item.full_name,
        role: item.role || "viewer",
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        last_sign_in_at: item.last_sign_in_at,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        full_name: user.full_name || "",
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: "",
        full_name: "",
        role: "viewer",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedUser) {
        // Update existing user
        const { error } = await supabase
          .from("user_roles")
          .update({
            full_name: formData.full_name || null,
            role: formData.role,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedUser.id);

        if (error) throw error;
        toast.success("User updated successfully");
      } else {
        // Create new user role entry
        const { error } = await supabase.from("user_roles").insert([
          {
            email: formData.email,
            full_name: formData.full_name || null,
            role: formData.role,
            is_active: formData.is_active,
          },
        ]);

        if (error) throw error;
        toast.success("User created successfully");
      }

      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ is_active: false })
        .eq("id", selectedUser.id);

      if (error) throw error;
      toast.success("User deactivated successfully");
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">
              User Management
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Manage user accounts and role assignments
            </p>
          </div>
          <Button
            className="bg-[#1E3A5F] hover:bg-[#2d4a6f]"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredUsers.length} users
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Users</CardTitle>
            <CardDescription className="text-xs">
              All registered users with their role assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F7FA]">
                  <TableHead className="text-xs font-medium">User</TableHead>
                  <TableHead className="text-xs font-medium">Role</TableHead>
                  <TableHead className="text-xs font-medium">Status</TableHead>
                  <TableHead className="text-xs font-medium">Created</TableHead>
                  <TableHead className="text-xs font-medium">
                    Last Login
                  </TableHead>
                  <TableHead className="text-xs font-medium text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-sm text-[#6B7280]"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-sm text-[#6B7280]"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="h-12">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {user.full_name?.[0]?.toUpperCase() ||
                              user.email?.[0]?.toUpperCase() ||
                              "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1F2937]">
                              {user.full_name || "-"}
                            </p>
                            <p className="text-xs text-[#6B7280]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${roleBadgeColors[user.role]} text-xs font-normal`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            user.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#6B7280]">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-[#6B7280]">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? "Edit User" : "Add New User"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? "Update user information and role assignment"
                  : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!!selectedUser}
                  placeholder="user@example.com"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="John Doe"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as UserRole })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="export_staff">Export Staff</SelectItem>
                    <SelectItem value="import_staff">Import Staff</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="text-sm">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#1E3A5F] hover:bg-[#2d4a6f]"
                onClick={handleSave}
                disabled={isSaving || !formData.email}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Deactivate User</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate this user? They will no
                longer be able to access the system.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-[#1F2937]">
                <strong>Email:</strong> {selectedUser?.email}
              </p>
              <p className="text-sm text-[#1F2937]">
                <strong>Name:</strong> {selectedUser?.full_name || "-"}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
              >
                {isSaving ? "Processing..." : "Deactivate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
