"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types";
import { 
  addAdAccounts, 
  updateAdAccountName, 
  deleteAdAccount,
  fetchAvailableAccounts,
  type AvailableAccount 
} from "@/services/accountsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, ExternalLink, Shield, Users, UserPlus, Mail, Building } from "lucide-react";
import { AdAccount } from "@/types";

export default function SettingsPage() {
  const { accounts, loading, refreshAccounts } = useAccount();
  const { user, users, addUser, updateUser, deleteUser, hasPermission } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User management states
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: 'Admin' | 'Strategist';
    assignedAccounts: string[];
  }>({
    name: '',
    email: '',
    role: 'Strategist',
    assignedAccounts: [],
  });
  
  // Available accounts from webhook
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'Admin';

  // Fetch available accounts when dialog opens
  useEffect(() => {
    if (isAddDialogOpen && isAdmin) {
      loadAvailableAccounts();
    }
  }, [isAddDialogOpen, isAdmin]);

  const loadAvailableAccounts = async () => {
    setLoadingAvailable(true);
    setError(null);
    setSelectedAccounts(new Set());
    
    try {
      const available = await fetchAvailableAccounts();
      
      // Filter out accounts that are already added
      const existingIds = new Set(accounts.map(acc => acc.facebook_account_id));
      const filteredAccounts = available.filter(acc => !existingIds.has(acc.id));
      
      setAvailableAccounts(filteredAccounts);
    } catch (error) {
      console.error("Error loading available accounts:", error);
      setError(error instanceof Error ? error.message : "Failed to load available accounts");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const selectAllAccounts = () => {
    const allIds = new Set(availableAccounts.map(acc => acc.id));
    setSelectedAccounts(allIds);
  };

  const deselectAllAccounts = () => {
    setSelectedAccounts(new Set());
  };

  const handleAddSelectedAccounts = async () => {
    if (selectedAccounts.size === 0) {
      setError("Please select at least one account to add");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    const loadingToast = toast.loading('Adding accounts...');
    
    try {
      const accountIds = Array.from(selectedAccounts);
      await addAdAccounts(accountIds);
      
      setSelectedAccounts(new Set());
      setIsAddDialogOpen(false);
      
      await refreshAccounts();
      
      const message = selectedAccounts.size === 1 
        ? "Account added successfully!" 
        : `${selectedAccounts.size} accounts added successfully!`;
      
      toast.success(message, {
        id: loadingToast,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding accounts:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add accounts";
      setError(errorMessage);
      
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const loadingToast = toast.loading('Updating account name...');
    
    try {
      await updateAdAccountName(
        editingAccount.facebook_account_id,
        editingAccount.account_name
      );
      
      setEditingAccount(null);
      setIsEditDialogOpen(false);
      
      await refreshAccounts();
      
      toast.success("Account name updated successfully!", {
        id: loadingToast,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error updating account:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update account name";
      setError(errorMessage);
      
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      return;
    }
    
    setError(null);
    
    const loadingToast = toast.loading('Deleting account...');
    
    try {
      await deleteAdAccount(accountId);
      await refreshAccounts();
      
      toast.success("Account deleted successfully!", {
        id: loadingToast,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      setError(errorMessage);
      
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  // User Management Functions
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email === newUser.email)) {
      toast.error("A user with this email already exists");
      return;
    }

    const loadingToast = toast.loading('Creating user...');
    
    const result = await addUser(newUser);
    
    if (result.success && result.password) {
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">User created successfully!</p>
          <p className="text-sm">Temporary password: <code className="bg-muted px-2 py-0.5 rounded font-mono">{result.password}</code></p>
          <p className="text-xs text-muted-foreground">Please save this password and share it securely.</p>
        </div>,
        {
          id: loadingToast,
          duration: 8000,
        }
      );
      
      setNewUser({
        name: '',
        email: '',
        role: 'Strategist',
        assignedAccounts: [],
      });
      setIsAddUserDialogOpen(false);
    } else {
      toast.error(result.error || 'Failed to create user', {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const loadingToast = toast.loading('Updating user...');

    const success = await updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      assignedAccounts: editingUser.assignedAccounts,
    });

    if (success) {
      toast.success("User updated successfully!", {
        id: loadingToast,
        duration: 3000,
      });
      setEditingUser(null);
      setIsEditUserDialogOpen(false);
    } else {
      toast.error("Failed to update user. Please try again.", {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    deleteUser(userId);
    toast.success("User deleted successfully!");
  };

  const toggleUserAccountAssignment = (userId: string, accountId: string) => {
    if (!editingUser || editingUser.id !== userId) return;

    const currentAccounts = editingUser.assignedAccounts || [];
    const newAccounts = currentAccounts.includes(accountId)
      ? currentAccounts.filter(id => id !== accountId)
      : [...currentAccounts, accountId];

    setEditingUser({
      ...editingUser,
      assignedAccounts: newAccounts,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "PAUSED":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Paused</Badge>;
      case "DISABLED":
        return <Badge className="bg-red-500 hover:bg-red-600">Disabled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>;
      case 'Strategist':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Strategist</Badge>;
      case 'Client':
        return <Badge className="bg-green-500 hover:bg-green-600">Client</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Manage your ad accounts, users, and application settings"
                : "View your account settings and preferences"
              }
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="accounts" className="gap-2">
                <Building className="h-4 w-4" />
                Ad Accounts
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  User Management
                </TabsTrigger>
              )}
            </TabsList>

            {/* Ad Accounts Tab */}
            <TabsContent value="accounts">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-1">
                      Ad Accounts
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin 
                        ? "Manage your connected Facebook/Meta ad accounts"
                        : "View ad accounts you have access to"
                      }
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Add Ad Accounts</DialogTitle>
                          <DialogDescription>
                            Select accounts from your Meta Business Manager to add to adOS
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                          {loadingAvailable ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading available accounts...</p>
                              </div>
                            </div>
                          ) : availableAccounts.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                  <Plus className="h-8 w-8 text-muted-foreground" />
                                </div>
                              </div>
                              <h3 className="text-lg font-semibold mb-2">No Accounts Available</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                All available accounts have already been added, or there are no accounts accessible from your Meta Business Manager.
                              </p>
                              <Button 
                                variant="outline" 
                                onClick={loadAvailableAccounts}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Refresh
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Found {availableAccounts.length} account{availableAccounts.length !== 1 ? 's' : ''} available to add
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={selectAllAccounts}
                                    className="text-xs"
                                  >
                                    Select All
                                  </Button>
                                  {selectedAccounts.size > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={deselectAllAccounts}
                                      className="text-xs"
                                    >
                                      Deselect All
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                {availableAccounts.map((account) => (
                                  <div
                                    key={account.id}
                                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                                      selectedAccounts.has(account.id) ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                                    }`}
                                    onClick={() => toggleAccountSelection(account.id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="pt-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedAccounts.has(account.id)}
                                          onChange={() => toggleAccountSelection(account.id)}
                                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="font-medium text-foreground">
                                              {account.business_name && account.business_name.trim() !== "" 
                                                ? account.business_name 
                                                : account.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                                                {account.id}
                                              </code>
                                              {account.account_status === 1 ? (
                                                <Badge className="bg-green-500 hover:bg-green-600 text-xs">Active</Badge>
                                              ) : (
                                                <Badge className="bg-gray-500 hover:bg-gray-600 text-xs">Inactive</Badge>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right text-sm">
                                            <p className="text-muted-foreground">Spent</p>
                                            <p className="font-medium">
                                              {formatCurrency(parseFloat(account.amount_spent) / 100, account.currency)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                          <span>{account.currency}</span>
                                          <span>•</span>
                                          <span>{account.timezone_name}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {selectedAccounts.size > 0 && (
                                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                                  <p className="text-sm text-foreground">
                                    <strong>{selectedAccounts.size}</strong> account{selectedAccounts.size !== 1 ? 's' : ''} selected
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          {availableAccounts.length > 0 && (
                            <Button 
                              onClick={handleAddSelectedAccounts} 
                              disabled={isSubmitting || selectedAccounts.size === 0}
                            >
                              {isSubmitting 
                                ? "Adding..." 
                                : `Add ${selectedAccounts.size > 0 ? selectedAccounts.size : ''} Account${selectedAccounts.size !== 1 ? 's' : ''}`}
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Accounts Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading accounts...</p>
                    </div>
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No ad accounts connected yet</p>
                    {isAdmin && (
                      <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Your First Account
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account Name</TableHead>
                          <TableHead>Facebook ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Total Spend</TableHead>
                          <TableHead>Avg ROAS</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">
                              {account.account_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {account.facebook_account_id}
                                </code>
                                <a
                                  href={`https://business.facebook.com/adsmanager/manage/accounts?act=${account.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(account.status)}</TableCell>
                            <TableCell>{account.currency}</TableCell>
                            <TableCell>
                              {formatCurrency(account.total_spend, account.currency)}
                            </TableCell>
                            <TableCell>
                              {account.avg_roas ? (
                                <span className={account.avg_roas >= 2 ? "text-green-600 font-medium" : ""}>
                                  {account.avg_roas.toFixed(2)}x
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingAccount(account);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAccount(account.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* User Management Tab (Admin Only) */}
            {isAdmin && (
              <TabsContent value="users">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-1">
                        User Management
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Create and manage strategist accounts and their ad account access
                      </p>
                    </div>
                    
                    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <UserPlus className="h-4 w-4" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleAddUser}>
                          <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                              Create a new strategist user and assign them ad accounts
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                placeholder="John Doe"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                required
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                required
                              />
                            </div>
                            
                            <div className="grid gap-2">
                              <Label htmlFor="role">Role</Label>
                              <Select 
                                value={newUser.role} 
                                onValueChange={(value) => {
                                  const role = value as 'Admin' | 'Strategist';
                                  setNewUser({ ...newUser, role });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Strategist">Strategist</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {newUser.role === 'Strategist' && (
                              <div className="grid gap-2">
                                <Label>Assigned Ad Accounts</Label>
                                <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                                  {accounts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No accounts available
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {accounts.map((account) => (
                                        <label
                                          key={account.id}
                                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={newUser.assignedAccounts.includes(account.id)}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              setNewUser({
                                                ...newUser,
                                                assignedAccounts: checked
                                                  ? [...newUser.assignedAccounts, account.id]
                                                  : newUser.assignedAccounts.filter(id => id !== account.id)
                                              });
                                            }}
                                            className="h-4 w-4"
                                          />
                                          <span className="text-sm flex-1">{account.account_name}</span>
                                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                            {account.facebook_account_id}
                                          </code>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="bg-muted p-3 rounded-lg text-sm">
                              <p className="text-muted-foreground">
                                <strong>Note:</strong> Default password will be: <code className="bg-background px-1 py-0.5 rounded">
                                  {newUser.name ? `${newUser.name.split(' ')[0].toLowerCase()}123` : '[firstname]123'}
                                </code>
                              </p>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsAddUserDialogOpen(false);
                                setNewUser({
                                  name: '',
                                  email: '',
                                  role: 'Strategist',
                                  assignedAccounts: [],
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              Create User
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Users Table */}
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Assigned Accounts</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {user.role === 'Admin' ? (
                                  <Shield className="h-4 w-4 text-purple-500" />
                                ) : (
                                  <Users className="h-4 w-4 text-blue-500" />
                                )}
                                {user.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {user.email}
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>
                              {user.role === 'Admin' ? (
                                <span className="text-sm text-muted-foreground">All Accounts</span>
                              ) : user.assignedAccounts && user.assignedAccounts.length > 0 ? (
                                <Badge variant="outline">
                                  {user.assignedAccounts.length} account{user.assignedAccounts.length !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">No accounts</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user);
                                    setIsEditUserDialogOpen(true);
                                  }}
                                  disabled={user.role === 'Admin' && user.id === '1'}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  disabled={user.role === 'Admin' && user.id === '1'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Edit Account Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              {editingAccount && (
                <form onSubmit={handleEditAccount}>
                  <DialogHeader>
                    <DialogTitle>Edit Account Business Name</DialogTitle>
                    <DialogDescription>
                      Update the business name for this ad account
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_facebook_account_id">Facebook Account ID</Label>
                      <Input
                        id="edit_facebook_account_id"
                        value={editingAccount.facebook_account_id}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Account ID cannot be changed
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit_account_name">
                        Business Name *
                      </Label>
                      <Input
                        id="edit_account_name"
                        placeholder="Enter business name"
                        value={editingAccount.account_name}
                        onChange={(e) =>
                          setEditingAccount({ ...editingAccount, account_name: e.target.value })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This name will be displayed throughout the application
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              {editingUser && (
                <form onSubmit={handleEditUser}>
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user details and ad account assignments
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit_name">Full Name *</Label>
                      <Input
                        id="edit_name"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit_email">Email *</Label>
                      <Input
                        id="edit_email"
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        required
                      />
                    </div>

                    {editingUser.role === 'Strategist' && (
                      <div className="grid gap-2">
                        <Label>Assigned Ad Accounts</Label>
                        <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                          {accounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No accounts available
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {accounts.map((account) => (
                                <label
                                  key={account.id}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingUser.assignedAccounts?.includes(account.id) || false}
                                    onChange={() => toggleUserAccountAssignment(editingUser.id, account.id)}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm flex-1">{account.account_name}</span>
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {account.facebook_account_id}
                                  </code>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditUserDialogOpen(false);
                        setEditingUser(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
}
