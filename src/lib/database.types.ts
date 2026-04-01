export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          photo_url: string | null;
          title: string | null;
          company: string | null;
          location: string | null;
          industry: string | null;
          bio: string | null;
          tags: string[];
          linkedin: string | null;
          twitter: string | null;
          website: string | null;
          joined_date: string | null;
          notion_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          photo_url?: string | null;
          title?: string | null;
          company?: string | null;
          location?: string | null;
          industry?: string | null;
          bio?: string | null;
          tags?: string[];
          linkedin?: string | null;
          twitter?: string | null;
          website?: string | null;
          joined_date?: string | null;
          notion_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          photo_url?: string | null;
          title?: string | null;
          company?: string | null;
          location?: string | null;
          industry?: string | null;
          bio?: string | null;
          tags?: string[];
          linkedin?: string | null;
          twitter?: string | null;
          website?: string | null;
          joined_date?: string | null;
          notion_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          member_id: string;
          added_at: string;
        };
        Insert: {
          group_id: string;
          member_id: string;
          added_at?: string;
        };
        Update: {
          group_id?: string;
          member_id?: string;
          added_at?: string;
        };
      };
    };
  };
}
