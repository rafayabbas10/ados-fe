import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';

// Configure your n8n webhook URL
const USER_PROFILE_WEBHOOK_URL = process.env.NEXT_PUBLIC_USER_PROFILE_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/user-profile';

export const userProfileService = {
  /**
   * Fetch user profile via n8n webhook
   * Sends Supabase auth token for authentication
   */
  async getUserProfile(): Promise<User | null> {
    try {
      const supabase = createClient();
      
      // Get the current session and access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        return null;
      }

      // Call your n8n webhook with the auth token
      const response = await fetch(USER_PROFILE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send the Supabase access token for authentication
          'Authorization': `Bearer ${session.access_token}`,
          // Optional: Send user ID directly if your webhook needs it
          'X-User-ID': session.user.id,
        },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          // Include any other data your webhook might need
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const data = await response.json();

      // Map the webhook response to your User type
      const userProfile: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as 'Admin' | 'Strategist' | 'Client',
        createdAt: data.created_at,
        createdBy: data.created_by,
        assignedAccounts: data.assigned_accounts || [],
      };

      return userProfile;
    } catch (error) {
      console.error('Error fetching user profile from webhook:', error);
      return null;
    }
  },

  /**
   * Fetch all users (Admin only) via n8n webhook
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const supabase = createClient();
      
      // Get the current session and access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        return [];
      }

      const ALL_USERS_WEBHOOK_URL = process.env.NEXT_PUBLIC_ALL_USERS_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/all-users';

      // Call your n8n webhook with the auth token
      const response = await fetch(ALL_USERS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-ID': session.user.id,
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const data = await response.json();

      // Map the webhook response to User array
      return data.users || [];
    } catch (error) {
      console.error('Error fetching all users from webhook:', error);
      return [];
    }
  },

  /**
   * Create a new user via n8n webhook
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<{ user: User | null; error: Error | null }> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { user: null, error: new Error('No active session') };
      }

      const CREATE_USER_WEBHOOK_URL = process.env.NEXT_PUBLIC_CREATE_USER_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/create-user';

      const response = await fetch(CREATE_USER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-ID': session.user.id,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { user: null, error: errorData };
      }

      const data = await response.json();
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error | null };
    }
  },
};

