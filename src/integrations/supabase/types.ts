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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      action_life_areas: {
        Row: {
          action_id: string
          life_area_id: string
          user_id: string
        }
        Insert: {
          action_id: string
          life_area_id: string
          user_id: string
        }
        Update: {
          action_id?: string
          life_area_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_life_areas_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_life_areas_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          goal_id: string | null
          helps_with: string | null
          id: string
          name: string
          start_date: string
          type: string
          updated_at: string
          user_id: string
          why_important: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          goal_id?: string | null
          helps_with?: string | null
          id?: string
          name: string
          start_date?: string
          type: string
          updated_at?: string
          user_id: string
          why_important?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          goal_id?: string | null
          helps_with?: string | null
          id?: string
          name?: string
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          why_important?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          action_id: string
          created_at: string
          id: string
          title: string | null
          type: string
          url: string
          user_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          title?: string | null
          type: string
          url: string
          user_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          title?: string | null
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      completions: {
        Row: {
          action_id: string
          completed_at: string | null
          created_at: string
          id: string
          occurrence_date: string
          schedule_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          occurrence_date: string
          schedule_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          occurrence_date?: string
          schedule_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          archived_at: string | null
          closed_on: string | null
          completed_at: string | null
          created_at: string
          id: string
          life_area_id: string
          result_text: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          closed_on?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          life_area_id: string
          result_text: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          closed_on?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          life_area_id?: string
          result_text?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      life_areas: {
        Row: {
          description: string
          id: string
          name: string
          question: string
          sort_order: number
        }
        Insert: {
          description: string
          id: string
          name: string
          question: string
          sort_order: number
        }
        Update: {
          description?: string
          id?: string
          name?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          created_at: string
          effective_actions: string | null
          id: string
          month: string
          next_experiment: string | null
          obstacles: string | null
          real_result: string | null
          system_change: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_actions?: string | null
          id?: string
          month: string
          next_experiment?: string | null
          obstacles?: string | null
          real_result?: string | null
          system_change?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_actions?: string | null
          id?: string
          month?: string
          next_experiment?: string | null
          obstacles?: string | null
          real_result?: string | null
          system_change?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ritual_item_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          occurrence_date: string
          ritual_item_id: string
          schedule_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          occurrence_date: string
          ritual_item_id: string
          schedule_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          occurrence_date?: string
          ritual_item_id?: string
          schedule_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_item_completions_ritual_item_id_fkey"
            columns: ["ritual_item_id"]
            isOneToOne: false
            referencedRelation: "ritual_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_item_completions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_items: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          name: string
          ritual_action_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          name: string
          ritual_action_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          name?: string
          ritual_action_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_items_ritual_action_id_fkey"
            columns: ["ritual_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          action_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          repeat_type: string
          scheduled_date: string | null
          start_time: string | null
          status: string
          updated_at: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          action_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          repeat_type?: string
          scheduled_date?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
          weekdays?: number[]
        }
        Update: {
          action_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          repeat_type?: string
          scheduled_date?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "schedules_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
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
  public: {
    Enums: {},
  },
} as const
