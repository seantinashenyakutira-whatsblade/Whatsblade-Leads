// Generated types for Supabase queries.
// In production, run: npx supabase gen types typescript --linked > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'agent';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'agent';
          is_active?: boolean;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'agent';
          is_active?: boolean;
        };
      };
      leads: {
        Row: {
          id: string;
          assigned_to: string | null;
          created_by: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          position: string | null;
          website: string | null;
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          source: string | null;
          notes: string | null;
          attachments: Json;
          custom_fields: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_by: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          website?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          source?: string | null;
          notes?: string | null;
          attachments?: Json;
          custom_fields?: Json;
        };
        Update: {
          assigned_to?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          position?: string | null;
          website?: string | null;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          source?: string | null;
          notes?: string | null;
          attachments?: Json;
          custom_fields?: Json;
        };
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: 'draft' | 'active' | 'paused' | 'completed';
          created_by: string;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          created_by: string;
          scheduled_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          lead_id: string;
          campaign_id: string | null;
          sent_by: string;
          channel: 'email' | 'sms' | 'whatsapp' | 'linkedin';
          subject: string | null;
          body: string;
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          replied_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          campaign_id?: string | null;
          sent_by: string;
          channel?: 'email' | 'sms' | 'whatsapp' | 'linkedin';
          subject?: string | null;
          body: string;
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
          metadata?: Json;
        };
        Update: {
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          replied_at?: string | null;
          metadata?: Json;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          provider: string;
          key_encrypted: string;
          key_iv: string;
          key_tag: string;
          last_used_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          provider: string;
          key_encrypted: string;
          key_iv: string;
          key_tag: string;
          expires_at?: string | null;
        };
        Update: {
          last_used_at?: string | null;
          is_active?: boolean;
        };
      };
      webhooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          events: string[];
          secret: string;
          is_active: boolean;
          last_triggered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          url: string;
          events: string[];
          secret: string;
        };
        Update: {
          name?: string;
          url?: string;
          events?: string[];
          is_active?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
  };
}
