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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string
          email_notifications: boolean | null
          gender: string | null
          headline: string | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          lastname: string | null
          linkedin_url: string | null
          name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          profile_completion_percentage: number | null
          profile_picture_url: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          role: string
          state: string | null
          total_rating: number | null
          total_reviews: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email: string
          email_notifications?: boolean | null
          gender?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          lastname?: string | null
          linkedin_url?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_completion_percentage?: number | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role: string
          state?: string | null
          total_rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string
          email_notifications?: boolean | null
          gender?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          lastname?: string | null
          linkedin_url?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_completion_percentage?: number | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          role?: string
          state?: string | null
          total_rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          academic_level: string | null
          budget_range: string | null
          created_at: string | null
          current_grade: string | null
          expected_graduation: string | null
          favorite_teachers: string[] | null
          graduation_year: number | null
          id: string
          institution_id: string | null
          major: string | null
          max_budget_per_task: number | null
          payment_methods: Json | null
          preferred_communication: string | null
          preferred_learning_style: string | null
          preferred_task_duration: string | null
          student_type: string | null
          subjects: string[] | null
          subjects_of_interest: string[] | null
          total_spent: number | null
          total_tasks_completed: number | null
          total_tasks_created: number | null
          university: string | null
          updated_at: string | null
        }
        Insert: {
          academic_level?: string | null
          budget_range?: string | null
          created_at?: string | null
          current_grade?: string | null
          expected_graduation?: string | null
          favorite_teachers?: string[] | null
          graduation_year?: number | null
          id: string
          institution_id?: string | null
          major?: string | null
          max_budget_per_task?: number | null
          payment_methods?: Json | null
          preferred_communication?: string | null
          preferred_learning_style?: string | null
          preferred_task_duration?: string | null
          student_type?: string | null
          subjects?: string[] | null
          subjects_of_interest?: string[] | null
          total_spent?: number | null
          total_tasks_completed?: number | null
          total_tasks_created?: number | null
          university?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_level?: string | null
          budget_range?: string | null
          created_at?: string | null
          current_grade?: string | null
          expected_graduation?: string | null
          favorite_teachers?: string[] | null
          graduation_year?: number | null
          id?: string
          institution_id?: string | null
          major?: string | null
          max_budget_per_task?: number | null
          payment_methods?: Json | null
          preferred_communication?: string | null
          preferred_learning_style?: string | null
          preferred_task_duration?: string | null
          student_type?: string | null
          subjects?: string[] | null
          subjects_of_interest?: string[] | null
          total_spent?: number | null
          total_tasks_completed?: number | null
          total_tasks_created?: number | null
          university?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          accepts_long_term: boolean | null
          accepts_urgent_tasks: boolean | null
          alma_mater: string | null
          availability_hours: Json | null
          bank_account_verified: boolean | null
          certifications: string[] | null
          completion_rate: number | null
          created_at: string | null
          currency: string | null
          degrees: string[] | null
          education_level: string | null
          education_levels_taught: string[] | null
          emergency_contact: Json | null
          experience: string | null
          github_url: string | null
          hourly_rate: number
          id: string
          is_available: boolean | null
          languages: string[]
          max_concurrent_tasks: number | null
          max_project_budget: number | null
          min_project_budget: number | null
          native_language: string | null
          payment_info: Json | null
          payment_methods_accepted: string[] | null
          portfolio_url: string | null
          preferred_task_types: string[] | null
          repeat_client_rate: number | null
          response_time_hours: number | null
          sample_work_urls: string[] | null
          specialties: string[]
          subjects: string[]
          success_rate: number | null
          tax_id: string | null
          teaching_experience_years: number | null
          teaching_methodology: string | null
          tools_used: string[] | null
          total_earnings: number | null
          total_experience_years: number | null
          total_tasks_completed: number | null
          updated_at: string | null
          video_introduction_url: string | null
        }
        Insert: {
          accepts_long_term?: boolean | null
          accepts_urgent_tasks?: boolean | null
          alma_mater?: string | null
          availability_hours?: Json | null
          bank_account_verified?: boolean | null
          certifications?: string[] | null
          completion_rate?: number | null
          created_at?: string | null
          currency?: string | null
          degrees?: string[] | null
          education_level?: string | null
          education_levels_taught?: string[] | null
          emergency_contact?: Json | null
          experience?: string | null
          github_url?: string | null
          hourly_rate: number
          id: string
          is_available?: boolean | null
          languages?: string[]
          max_concurrent_tasks?: number | null
          max_project_budget?: number | null
          min_project_budget?: number | null
          native_language?: string | null
          payment_info?: Json | null
          payment_methods_accepted?: string[] | null
          portfolio_url?: string | null
          preferred_task_types?: string[] | null
          repeat_client_rate?: number | null
          response_time_hours?: number | null
          sample_work_urls?: string[] | null
          specialties: string[]
          subjects: string[]
          success_rate?: number | null
          tax_id?: string | null
          teaching_experience_years?: number | null
          teaching_methodology?: string | null
          tools_used?: string[] | null
          total_earnings?: number | null
          total_experience_years?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          video_introduction_url?: string | null
        }
        Update: {
          accepts_long_term?: boolean | null
          accepts_urgent_tasks?: boolean | null
          alma_mater?: string | null
          availability_hours?: Json | null
          bank_account_verified?: boolean | null
          certifications?: string[] | null
          completion_rate?: number | null
          created_at?: string | null
          currency?: string | null
          degrees?: string[] | null
          education_level?: string | null
          education_levels_taught?: string[] | null
          emergency_contact?: Json | null
          experience?: string | null
          github_url?: string | null
          hourly_rate?: number
          id?: string
          is_available?: boolean | null
          languages?: string[]
          max_concurrent_tasks?: number | null
          max_project_budget?: number | null
          min_project_budget?: number | null
          native_language?: string | null
          payment_info?: Json | null
          payment_methods_accepted?: string[] | null
          portfolio_url?: string | null
          preferred_task_types?: string[] | null
          repeat_client_rate?: number | null
          response_time_hours?: number | null
          sample_work_urls?: string[] | null
          specialties?: string[]
          subjects?: string[]
          success_rate?: number | null
          tax_id?: string | null
          teaching_experience_years?: number | null
          teaching_methodology?: string | null
          tools_used?: string[] | null
          total_earnings?: number | null
          total_experience_years?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          video_introduction_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
