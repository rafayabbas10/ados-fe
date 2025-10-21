"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, AuthContextType, Permission } from '@/types';
import { usersService } from '@/services/usersService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple user profile cache in localStorage
const USER_CACHE_KEY = 'ados_user_profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Simple function to create user profile from auth data
  const createUserProfile = async (authUser: SupabaseUser): Promise<User> => {
    // Try to get cached profile first (for instant load)
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      try {
        const cachedProfile = JSON.parse(cached);
        if (cachedProfile.id === authUser.id) {
          console.log('✅ Using cached profile (will refresh from DB)');
          // Return cached but continue to refresh in background
          setTimeout(() => enrichUserProfile(authUser, cachedProfile), 100);
          return cachedProfile;
        }
      } catch (e) {
        console.warn('Failed to parse cached profile');
      }
    }

    // Determine role based on email or metadata
    const role = authUser.user_metadata?.role || 
                 (authUser.email === 'admin@ados.com' ? 'Admin' : 'Strategist');
    
    // Get assigned accounts from database
    let assignedAccounts: string[] = [];
    if (role === 'Strategist') {
      try {
        assignedAccounts = await usersService.getUserAccounts(authUser.id);
        console.log('✅ Loaded assigned accounts from DB:', assignedAccounts);
      } catch (error) {
        console.warn('⚠️ Could not load assigned accounts, using metadata fallback');
        assignedAccounts = authUser.user_metadata?.assignedAccounts || [];
      }
    }
    
    const userProfile: User = {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
      role: role as 'Admin' | 'Strategist' | 'Client',
      createdAt: authUser.created_at || new Date().toISOString(),
      createdBy: undefined,
      assignedAccounts,
    };

    // Cache the profile
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userProfile));
    return userProfile;
  };

  // Background function to enrich profile from database
  const enrichUserProfile = async (authUser: SupabaseUser, currentProfile: User) => {
    try {
      if (currentProfile.role === 'Strategist') {
        const latestAccounts = await usersService.getUserAccounts(authUser.id);
        
        // Only update if accounts changed
        const currentAccountsStr = JSON.stringify(currentProfile.assignedAccounts?.sort());
        const latestAccountsStr = JSON.stringify(latestAccounts.sort());
        
        if (currentAccountsStr !== latestAccountsStr) {
          console.log('🔄 Assigned accounts updated from DB');
          const updatedProfile = { ...currentProfile, assignedAccounts: latestAccounts };
          setUser(updatedProfile);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedProfile));
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to enrich user profile:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔑 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Session found for:', session.user.email);
          const profile = await createUserProfile(session.user);
          setUser(profile);
          setIsAuthenticated(true);
        } else {
          console.log('⚠️ No session found');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await createUserProfile(session.user);
          setUser(profile);
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setUsers([]);
          localStorage.removeItem(USER_CACHE_KEY);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          // Keep existing profile, just session refreshed
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load all users when authenticated as Admin
  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadAllUsers();
    }
  }, [user?.role]); // Only depend on role, not entire user object

  const loadAllUsers = async () => {
    try {
      console.log('📋 Loading all users...');
      
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No session, skipping user load');
        setUsers([]);
        return;
      }

      // Try webhook first
      const ALL_USERS_WEBHOOK_URL = process.env.NEXT_PUBLIC_ALL_USERS_WEBHOOK_URL || 
                                    'https://n8n.srv931040.hstgr.cloud/webhook/all-users';
      
      try {
        console.log('📡 Calling all-users webhook');
        
        const response = await fetch(ALL_USERS_WEBHOOK_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Webhook error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ All users loaded from webhook:', data.length);

        // Transform webhook data to match our User type
        const transformedUsers = data.map((webhookUser: Record<string, unknown>) => ({
          id: webhookUser.id as string,
          email: webhookUser.email as string,
          name: webhookUser.name as string,
          role: webhookUser.role as string,
          createdAt: webhookUser.created_at as string,
          createdBy: webhookUser.created_by as string,
          // Extract account IDs from assigned_accounts array
          assignedAccounts: (webhookUser.assigned_accounts as Array<Record<string, unknown>>)?.map((acc) => acc.account_id as string) || [],
        }));

        setUsers(transformedUsers);
        return;
      } catch (webhookError) {
        console.error('❌ Webhook failed, using database fallback:', webhookError);
      }

      // Fallback to database
      const allUsers = await usersService.getAllUsers();
      setUsers(allUsers);
      console.log('✅ All users loaded from database:', allUsers.length);
      
    } catch (error: unknown) {
      console.error('❌ Error loading users:', error instanceof Error ? error.message : 'Unknown error');
      // Final fallback to just current user
      if (user) {
        setUsers([user]);
      } else {
        setUsers([]);
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Logging in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Login successful');
        // User profile will be set by onAuthStateChange event
        return true;
      }

      return false;
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await supabase.auth.signOut();
      // User state will be cleared by onAuthStateChange event
      router.push('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const addUser = async (newUser: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; password?: string; error?: string }> => {
    try {
      console.log('👤 Starting user creation process...');
      
      // Generate a temporary password
      const tempPassword = `${newUser.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 10000)}`;
      
      // Step 1: Create auth user and profile
      const { user: createdUser, error } = await usersService.createUser({
        email: newUser.email,
        password: tempPassword,
        name: newUser.name,
        role: newUser.role,
      });

      if (error) {
        console.error('❌ Error creating user:', error);
        return { success: false, error: error.message || 'Failed to create user' };
      }

      if (!createdUser) {
        return { success: false, error: 'User profile was not created' };
      }

      console.log('✅ User profile created successfully');

      // Step 2: Assign accounts if provided (via webhook)
      if (newUser.assignedAccounts && newUser.assignedAccounts.length > 0) {
        console.log('🔗 Assigning accounts:', newUser.assignedAccounts);
        const syncSuccess = await usersService.syncUserAccounts(createdUser.id, newUser.assignedAccounts);
        
        if (!syncSuccess) {
          console.error('⚠️ Failed to sync accounts, but user was created');
          // Don't fail the whole operation, just warn
        } else {
          console.log('✅ Accounts assigned successfully via webhook');
        }
      }

      // Step 3: Reload users list
      await loadAllUsers();

      console.log(`✅ User creation complete: ${newUser.email}`);
      return { success: true, password: tempPassword };
    } catch (error) {
      console.error('❌ Error adding user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      console.log('📝 Updating user:', userId, 'with fields:', Object.keys(updates));
      
      // Update user profile fields (name, email, role)
      const success = await usersService.updateUser(userId, updates);
      
      if (!success) {
        console.error('❌ Failed to update user profile');
        return false;
      }

      console.log('✅ User profile updated');

      // Update assigned accounts if provided (via webhook)
      if (updates.assignedAccounts !== undefined) {
        console.log('🔗 Updating assigned accounts:', updates.assignedAccounts);
        const syncSuccess = await usersService.syncUserAccounts(userId, updates.assignedAccounts);
        
        if (!syncSuccess) {
          console.warn('⚠️ Failed to sync accounts, but profile was updated');
        } else {
          console.log('✅ Accounts updated via webhook');
        }
      }

      // Reload users list to reflect changes
      await loadAllUsers();

      // Update current user state if editing own profile
      if (user?.id === userId) {
        console.log('🔄 Updating current user state');
        const updatedUserProfile = await usersService.getUserById(userId);
        if (updatedUserProfile) {
          const assignedAccounts = updatedUserProfile.role === 'Strategist' 
            ? await usersService.getUserAccounts(userId)
            : [];
          setUser({ ...updatedUserProfile, assignedAccounts });
          
          // Update cache
          const cachedProfile = { ...updatedUserProfile, assignedAccounts };
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachedProfile));
        }
      }

      console.log('✅ User update complete');
      return true;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const success = await usersService.deleteUser(userId);
      
      if (!success) {
        console.error('Failed to delete user');
        return;
      }

      // Reload users list
      await loadAllUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    switch (user.role) {
      case 'Admin':
        // Admin has all permissions
        return true;
      
      case 'Strategist':
        // Strategist can view only assigned accounts
        return permission === 'view_assigned_accounts_only';
      
      case 'Client':
        // Client can only access workflow page
        return permission === 'access_workflow_only';
      
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      users,
      addUser,
      updateUser,
      deleteUser,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

