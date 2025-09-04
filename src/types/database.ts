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
      posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          category: string
          created_at: string
          updated_at: string
          is_anonymous: boolean
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          category: string
          created_at?: string
          updated_at?: string
          is_anonymous?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          category?: string
          created_at?: string
          updated_at?: string
          is_anonymous?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          expertise: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          expertise?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          expertise?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          company: string
          location: string
          type: 'full-time' | 'part-time' | 'freelance' | 'contract'
          salary_range: string | null
          requirements: string[]
          poster_id: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          company: string
          location: string
          type: 'full-time' | 'part-time' | 'freelance' | 'contract'
          salary_range?: string | null
          requirements?: string[]
          poster_id: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          company?: string
          location?: string
          type?: 'full-time' | 'part-time' | 'freelance' | 'contract'
          salary_range?: string | null
          requirements?: string[]
          poster_id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
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
