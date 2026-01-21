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
      judges: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      score_categories: {
        Row: {
          id: string
          name: string
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          max_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          max_score?: number
          created_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          team_id: string
          judge_id: string
          category_id: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          judge_id: string
          category_id: string
          score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          judge_id?: string
          category_id?: string
          score?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          team_id: string
          judge_id: string
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          judge_id: string
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          judge_id?: string
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
