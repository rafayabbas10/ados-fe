import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';

export const usersService = {
  /**
   * Get all users (Admin only) with their assigned accounts
   */
  async getAllUsers(): Promise<User[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    if (!data) return [];

    // Load assigned accounts for each user
    const usersWithAccounts = await Promise.all(
      data.map(async (user: Record<string, unknown>) => {
        if (user.role === 'Strategist') {
          const accounts = await this.getUserAccounts(user.id as string);
          return { ...user, assignedAccounts: accounts } as User;
        }
        return { ...user, assignedAccounts: [] as string[] } as User;
      })
    );

    return usersWithAccounts;
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  },

  /**
   * Create a new user (Admin only)
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<{ user: User | null; error: Error | null }> {
    const supabase = createClient();

    console.log('📝 Creating user:', userData.email);

    // Create auth user with email confirmation disabled for admin-created users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: undefined, // No redirect needed
        data: {
          name: userData.name,
          role: userData.role,
        },
      },
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return { user: null, error: authError };
    }

    if (!authData.user) {
      return { user: null, error: new Error('No user data returned from signup') };
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the profile was created by the trigger
    let profile = await this.getUserById(authData.user.id);
    
      // If trigger didn't work, create the profile manually
      if (!profile) {
        console.log('⚠️ Trigger did not create profile, creating manually');
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
          } as never);

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError);
          return { user: null, error: insertError };
        }

        profile = await this.getUserById(authData.user.id);
      }

    if (!profile) {
      return { user: null, error: new Error('User created but profile not found') };
    }

    console.log('✅ User profile created:', profile);
    return { user: profile, error: null };
  },

  /**
   * Update user (Admin or self)
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    const supabase = createClient();
    
    // Filter out fields that don't exist in the database table
    // assignedAccounts is managed separately in user_accounts table
    const { assignedAccounts, createdAt, createdBy, ...dbUpdates } = updates;
    
    // Only proceed if there are actual database fields to update
    if (Object.keys(dbUpdates).length === 0) {
      console.log('No database fields to update');
      return true;
    }

    console.log('Updating user with fields:', Object.keys(dbUpdates));
    
    const { error } = await supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user in database:', error);
      console.error('Update data:', dbUpdates);
      return false;
    }

    console.log('✅ User updated successfully');
    return true;
  },

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId: string): Promise<boolean> {
    const supabase = createClient();
    
    // This will also delete the auth user due to CASCADE
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  },

  /**
   * Get user's assigned accounts
   */
  async getUserAccounts(userId: string): Promise<string[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_accounts')
      .select('account_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user accounts:', error);
      return [];
    }

    return data?.map((ua: Record<string, unknown>) => ua.account_id as string) || [];
  },

  /**
   * Assign account to user using webhook (Admin only)
   */
  async assignAccountToUser(userId: string, accountId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session for account assignment');
      return false;
    }

    const WEBHOOK_URL = process.env.NEXT_PUBLIC_ASSIGN_USER_ACCOUNT_WEBHOOK_URL || 
                        'https://n8n.srv931040.hstgr.cloud/webhook/assign-user-account';

    try {
      console.log(`📡 Webhook: Assigning account ${accountId} to user ${userId}`);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          account_id: accountId,
          assigned_by: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Webhook error:`, response.status, errorText);
        
        // Fallback to direct DB insert
        console.warn('⚠️ Webhook failed, using database fallback');
        const { error } = await supabase
          .from('user_accounts')
          .insert({
            user_id: userId,
            account_id: accountId,
            assigned_by: session.user.id,
          } as never);

        if (error) {
          console.error('❌ Database fallback also failed:', error);
          return false;
        }
        
        console.log('✅ Account assigned via database fallback');
        return true;
      }

      const result = await response.json();
      
      // Webhook may return array or single object
      if (Array.isArray(result) ? result.length > 0 : result) {
        console.log(`✅ Account assigned via webhook:`, result);
        return true;
      } else {
        console.warn(`⚠️ Unexpected webhook response:`, result);
        return true; // Still consider success if we got a response
      }
    } catch (error) {
      console.error('❌ Error assigning account:', error);
      
      // Final fallback to direct DB insert
      try {
        const { error: dbError } = await supabase
          .from('user_accounts')
          .insert({
            user_id: userId,
            account_id: accountId,
            assigned_by: session.user.id,
          } as never);

        if (dbError) throw dbError;
        
        console.log('✅ Account assigned via database fallback after error');
        return true;
      } catch (fallbackError) {
        console.error('❌ All assignment methods failed:', fallbackError);
        return false;
      }
    }
  },

  /**
   * Remove account from user (Admin only)
   */
  async removeAccountFromUser(userId: string, accountId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('user_accounts')
      .delete()
      .eq('user_id', userId)
      .eq('account_id', accountId);

    if (error) {
      console.error('Error removing account:', error);
      return false;
    }

    return true;
  },

  /**
   * Sync multiple account assignments using webhook (replaces existing)
   */
  async syncUserAccounts(userId: string, accountIds: string[]): Promise<boolean> {
    const supabase = createClient();
    
    // Get current user session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session for account assignment');
      return false;
    }

    const WEBHOOK_URL = process.env.NEXT_PUBLIC_ASSIGN_USER_ACCOUNT_WEBHOOK_URL || 
                        'https://n8n.srv931040.hstgr.cloud/webhook/assign-user-account';

    try {
      console.log(`🔗 Assigning ${accountIds.length} accounts to user ${userId}`);
      
      // Remove all existing assignments first (direct DB call)
      const { error: deleteError } = await supabase
        .from('user_accounts')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.warn('⚠️ Error removing old assignments:', deleteError);
        // Continue anyway - webhook might handle it
      }

      // Call webhook with array of account IDs (single call)
      if (accountIds.length > 0) {
        try {
          console.log(`📡 Webhook: Assigning ${accountIds.length} accounts to user ${userId}`);
          console.log(`📡 Account IDs:`, accountIds);
          
          const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_id: userId,
              account_ids: accountIds, // Send as array
              assigned_by: session.user.id,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Webhook error:`, response.status, errorText);
            throw new Error(`Webhook failed: ${response.status}`);
          }

          const result = await response.json();
          
          // Webhook returns array of inserted records
          if (Array.isArray(result) && result.length === accountIds.length) {
            console.log(`✅ All ${accountIds.length} accounts assigned via webhook:`, result);
            return true;
          } else {
            console.warn(`⚠️ Webhook response unexpected format:`, result);
            return true; // Still consider it success if we got a response
          }
          
        } catch (error) {
          console.error(`❌ Webhook failed:`, error);
          
          // Fallback to direct DB insert
          console.warn('⚠️ Webhook failed, using database fallback');
          const assignments = accountIds.map(accountId => ({
            user_id: userId,
            account_id: accountId,
            assigned_by: session.user.id,
          }));

          const { error: dbError } = await supabase
            .from('user_accounts')
            .insert(assignments as never);

          if (dbError) {
            console.error('❌ Database fallback also failed:', dbError);
            return false;
          }
          
          console.log('✅ Accounts assigned via database fallback');
          return true;
        }
      }

      // If no accounts to assign, just return success (we already deleted old ones)
      console.log('✅ Cleared all account assignments');
      return true;
      
    } catch (error) {
      console.error('❌ Error syncing user accounts:', error);
      return false;
    }
  },
};

