export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          created_at: string
          data: Json | null
          dataset_id: string | null
          description: string | null
          expires_at: string | null
          id: string
          insight_type: string
          title: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          data?: Json | null
          dataset_id?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          insight_type: string
          title: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          data?: Json | null
          dataset_id?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string | null
          created_at: string | null
          id: string
          is_global: boolean | null
          message: string | null
          seen: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          message?: string | null
          seen?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          message?: string | null
          seen?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          company_id: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown | null
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: unknown | null
          method: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_5e2825bd69_churn_predictions: {
        Row: {
          churn_probability: number
          created_at: string
          customer_id: string
          customer_name: string
          factors: Json | null
          id: string
          predicted_date: string | null
          revenue_impact: number | null
          risk_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          churn_probability: number
          created_at?: string
          customer_id: string
          customer_name: string
          factors?: Json | null
          id?: string
          predicted_date?: string | null
          revenue_impact?: number | null
          risk_level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          churn_probability?: number
          created_at?: string
          customer_id?: string
          customer_name?: string
          factors?: Json | null
          id?: string
          predicted_date?: string | null
          revenue_impact?: number | null
          risk_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_5e2825bd69_user_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          severity: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      churn_data: {
        Row: {
          company_id: string | null
          contract_type: string
          created_at: string
          customer_id: string | null
          dataset_id: string | null
          gender: string | null
          id: string
          internet_service: string | null
          label: boolean
          metadata: Json | null
          monthly_charges: number
          payment_method: string | null
          senior_citizen: boolean | null
          tenant_id: string | null
          tenure: number
          total_charges: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contract_type: string
          created_at?: string
          customer_id?: string | null
          dataset_id?: string | null
          gender?: string | null
          id?: string
          internet_service?: string | null
          label: boolean
          metadata?: Json | null
          monthly_charges: number
          payment_method?: string | null
          senior_citizen?: boolean | null
          tenant_id?: string | null
          tenure: number
          total_charges?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          contract_type?: string
          created_at?: string
          customer_id?: string | null
          dataset_id?: string | null
          gender?: string | null
          id?: string
          internet_service?: string | null
          label?: boolean
          metadata?: Json | null
          monthly_charges?: number
          payment_method?: string | null
          senior_citizen?: boolean | null
          tenant_id?: string | null
          tenure?: number
          total_charges?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_churn_data_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_churn_data_dataset"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaned_data_points: {
        Row: {
          active_member: number | null
          age: number | null
          age_tenure_interaction: number | null
          balance: number | null
          balance_salary_ratio: number | null
          churn: number | null
          cleaned_at: string | null
          company_id: string | null
          country: string | null
          country_france: number | null
          country_germany: number | null
          country_spain: number | null
          created_at: string | null
          credit_card: number | null
          credit_score: number | null
          customer_id: number | null
          data_quality_score: number | null
          date_recorded: string
          estimated_salary: number | null
          gender: string | null
          gender_male: number | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          original_dataset_id: string | null
          products_number: number | null
          tenure: number | null
          user_id: string
        }
        Insert: {
          active_member?: number | null
          age?: number | null
          age_tenure_interaction?: number | null
          balance?: number | null
          balance_salary_ratio?: number | null
          churn?: number | null
          cleaned_at?: string | null
          company_id?: string | null
          country?: string | null
          country_france?: number | null
          country_germany?: number | null
          country_spain?: number | null
          created_at?: string | null
          credit_card?: number | null
          credit_score?: number | null
          customer_id?: number | null
          data_quality_score?: number | null
          date_recorded: string
          estimated_salary?: number | null
          gender?: string | null
          gender_male?: number | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type?: string
          metric_value: number
          original_dataset_id?: string | null
          products_number?: number | null
          tenure?: number | null
          user_id: string
        }
        Update: {
          active_member?: number | null
          age?: number | null
          age_tenure_interaction?: number | null
          balance?: number | null
          balance_salary_ratio?: number | null
          churn?: number | null
          cleaned_at?: string | null
          company_id?: string | null
          country?: string | null
          country_france?: number | null
          country_germany?: number | null
          country_spain?: number | null
          created_at?: string | null
          credit_card?: number | null
          credit_score?: number | null
          customer_id?: number | null
          data_quality_score?: number | null
          date_recorded?: string
          estimated_salary?: number | null
          gender?: string | null
          gender_male?: number | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          original_dataset_id?: string | null
          products_number?: number | null
          tenure?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaned_data_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaned_data_points_original_dataset_id_fkey"
            columns: ["original_dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          max_users: number | null
          name: string
          settings: Json | null
          subdomain: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_users?: number | null
          name: string
          settings?: Json | null
          subdomain?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_users?: number | null
          name?: string
          settings?: Json | null
          subdomain?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      data_points: {
        Row: {
          company_id: string | null
          created_at: string
          dataset_id: string
          date_recorded: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          dataset_id: string
          date_recorded: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type?: string
          metric_value: number
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          dataset_id?: string
          date_recorded?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_points_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      datasets: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          metadata: Json | null
          name: string
          status: Database["public"]["Enums"]["dataset_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          metadata?: Json | null
          name: string
          status?: Database["public"]["Enums"]["dataset_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          status?: Database["public"]["Enums"]["dataset_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datasets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datasets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      powerbi_refresh_log: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          refresh_type: string
          started_at: string
          status: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          refresh_type?: string
          started_at?: string
          status: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          refresh_type?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      predictions_log: {
        Row: {
          actual_outcome: boolean | null
          company_id: string | null
          confidence_score: number | null
          created_at: string
          customer_id: string | null
          expires_at: string | null
          features: Json | null
          id: string
          input_features: Json
          model_version: string | null
          predicted_label: boolean
          predicted_probability: number
          prediction: number | null
          prediction_time: string | null
          prediction_type: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          actual_outcome?: boolean | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          customer_id?: string | null
          expires_at?: string | null
          features?: Json | null
          id?: string
          input_features?: Json
          model_version?: string | null
          predicted_label: boolean
          predicted_probability: number
          prediction?: number | null
          prediction_time?: string | null
          prediction_type?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          actual_outcome?: boolean | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          customer_id?: string | null
          expires_at?: string | null
          features?: Json | null
          id?: string
          input_features?: Json
          model_version?: string | null
          predicted_label?: boolean
          predicted_probability?: number
          prediction?: number | null
          prediction_time?: string | null
          prediction_type?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_predictions_log_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          company_id: string
          created_at: string
          endpoint_pattern: string
          id: string
          max_requests: number
          subscription_tier: string
          time_window_minutes: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          endpoint_pattern: string
          id?: string
          max_requests?: number
          subscription_tier?: string
          time_window_minutes?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          endpoint_pattern?: string
          id?: string
          max_requests?: number
          subscription_tier?: string
          time_window_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          company_id: string
          created_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      churn_predictions_view: {
        Row: {
          actual_churn: string | null
          contract_type: string | null
          customer_id: string | null
          monthly_charges: number | null
          predicted_churn: string | null
          predicted_probability: number | null
          prediction_time: string | null
          tenure: number | null
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_type: string | null
          created_at: string | null
          id: string | null
          is_global: boolean | null
          message: string | null
          seen: boolean | null
          title: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_alerts_view: {
        Row: {
          alert_color: string | null
          alert_id: string | null
          alert_type: string | null
          created_at: string | null
          is_global: boolean | null
          is_new: boolean | null
          message: string | null
          seen: boolean | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          alert_color?: never
          alert_id?: string | null
          alert_type?: string | null
          created_at?: string | null
          is_global?: boolean | null
          is_new?: never
          message?: string | null
          seen?: boolean | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          alert_color?: never
          alert_id?: string | null
          alert_type?: string | null
          created_at?: string | null
          is_global?: boolean | null
          is_new?: never
          message?: string | null
          seen?: boolean | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_user_company_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_highest_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          permission_type: Database["public"]["Enums"]["permission_type"]
          resource_type: string
          resource_uuid?: string
          user_uuid: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      mark_alert_seen: {
        Args: { alert_id: string }
        Returns: undefined
      }
      mark_all_alerts_seen: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "company_admin" | "analyst" | "viewer"
      dataset_status: "uploading" | "processing" | "completed" | "error"
      permission_type: "read" | "write" | "delete" | "admin"
      user_role:
        | "admin"
        | "analyst"
        | "manager"
        | "super_admin"
        | "company_admin"
        | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "company_admin", "analyst", "viewer"],
      dataset_status: ["uploading", "processing", "completed", "error"],
      permission_type: ["read", "write", "delete", "admin"],
      user_role: [
        "admin",
        "analyst",
        "manager",
        "super_admin",
        "company_admin",
        "viewer",
      ],
    },
  },
} as const
