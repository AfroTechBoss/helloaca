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
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          credits_remaining: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          credits_remaining?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          credits_remaining?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          user_id: string
          title: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          content: string
          status: 'pending' | 'analyzing' | 'completed' | 'failed'
          analysis_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          content: string
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          analysis_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          content?: string
          status?: 'pending' | 'analyzing' | 'completed' | 'failed'
          analysis_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      contract_analyses: {
        Row: {
          id: string
          contract_id: string
          user_id: string
          risk_score: number
          overall_assessment: string
          high_risk_clauses: Json
          missing_protections: Json
          recommendations: string[]
          analysis_duration_ms: number
          model_used: string
          status: 'pending' | 'in_progress' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          user_id: string
          risk_score: number
          overall_assessment: string
          high_risk_clauses: Json
          missing_protections: Json
          recommendations: string[]
          analysis_duration_ms: number
          model_used: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          user_id?: string
          risk_score?: number
          overall_assessment?: string
          high_risk_clauses?: Json
          missing_protections?: Json
          recommendations?: string[]
          analysis_duration_ms?: number
          model_used?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_analyses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          payment_method_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          payment_method_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          payment_method_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      plans: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          currency: string
          interval: 'month' | 'year'
          credits_included: number
          features: string[]
          is_popular: boolean
          stripe_price_id: string | null
          paystack_plan_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          currency?: string
          interval: 'month' | 'year'
          credits_included: number
          features: string[]
          is_popular?: boolean
          stripe_price_id?: string | null
          paystack_plan_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          currency?: string
          interval?: 'month' | 'year'
          credits_included?: number
          features?: string[]
          is_popular?: boolean
          stripe_price_id?: string | null
          paystack_plan_code?: string | null
          created_at?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          action_type: 'contract_upload' | 'analysis_request' | 'export_report'
          credits_used: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: 'contract_upload' | 'analysis_request' | 'export_report'
          credits_used: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: 'contract_upload' | 'analysis_request' | 'export_report'
          credits_used?: number
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}