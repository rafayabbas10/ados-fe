export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          created_at: string
          created_by: string | null
          updated_at: string | null
          last_login: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          name: string
          role: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          last_login?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          last_login?: string | null
          is_active?: boolean
        }
      }
      user_accounts: {
        Row: {
          id: number
          user_id: string
          account_id: string
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          user_id: string
          account_id: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          user_id?: string
          account_id?: string
          assigned_at?: string
          assigned_by?: string | null
        }
      }
      'Ad Accounts': {
        Row: {
          id: string
          name: string | null
          business_name: string | null
          status: string | null
          amount_spent: string | null
          balance: string | null
          currency: string | null
          timezone: string | null
        }
      }
      'Production Workflow': {
        Row: {
          id: number
          account_id: string | null
          name: string | null
          market_awareness: string | null
          angle: string | null
          format: string | null
          theme: string | null
          status: string | null
          assigned_to: string | null
          created_at: string
          avatar: string | null
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

