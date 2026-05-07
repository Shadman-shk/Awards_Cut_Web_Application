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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      award_categories: {
        Row: {
          created_at: string
          event_id: string
          id: string
          name: string
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          scheduled_order: number
          status: string
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          name: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_order?: number
          status?: string
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_order?: number
          status?: string
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      awardee_faces: {
        Row: {
          award_category_id: string | null
          awardee_name: string
          created_at: string
          descriptor: Json
          id: string
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          award_category_id?: string | null
          awardee_name: string
          created_at?: string
          descriptor: Json
          id?: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          award_category_id?: string | null
          awardee_name?: string
          created_at?: string
          descriptor?: Json
          id?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      detected_moments: {
        Row: {
          award_name: string | null
          ceremony_id: string | null
          clip_end: number | null
          clip_start: number | null
          confidence: number | null
          confidence_score: number
          confirmed_at: string | null
          created_at: string
          dismissed_at: string | null
          id: string
          matched_award_category_id: string | null
          matched_phrase: string | null
          moment_type: string
          source_video_url: string | null
          status: string
          stream_room_id: string | null
          timestamp: string
          timestamp_seconds: number | null
          user_id: string
          video_filename: string | null
          winner_name: string | null
        }
        Insert: {
          award_name?: string | null
          ceremony_id?: string | null
          clip_end?: number | null
          clip_start?: number | null
          confidence?: number | null
          confidence_score?: number
          confirmed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          matched_award_category_id?: string | null
          matched_phrase?: string | null
          moment_type: string
          source_video_url?: string | null
          status?: string
          stream_room_id?: string | null
          timestamp: string
          timestamp_seconds?: number | null
          user_id: string
          video_filename?: string | null
          winner_name?: string | null
        }
        Update: {
          award_name?: string | null
          ceremony_id?: string | null
          clip_end?: number | null
          clip_start?: number | null
          confidence?: number | null
          confidence_score?: number
          confirmed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          matched_award_category_id?: string | null
          matched_phrase?: string | null
          moment_type?: string
          source_video_url?: string | null
          status?: string
          stream_room_id?: string | null
          timestamp?: string
          timestamp_seconds?: number | null
          user_id?: string
          video_filename?: string | null
          winner_name?: string | null
        }
        Relationships: []
      }
      detection_settings: {
        Row: {
          auto_clip_enabled: boolean
          clip_after_seconds: number
          clip_before_seconds: number
          clip_duration_overrides: Json
          clip_duration_seconds: number
          confidence_threshold: number
          created_at: string
          detection_interval_seconds: number
          id: string
          layers_enabled: Json
          max_clips_per_stream: number
          moment_types_enabled: Json
          sensitivity_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_clip_enabled?: boolean
          clip_after_seconds?: number
          clip_before_seconds?: number
          clip_duration_overrides?: Json
          clip_duration_seconds?: number
          confidence_threshold?: number
          created_at?: string
          detection_interval_seconds?: number
          id?: string
          layers_enabled?: Json
          max_clips_per_stream?: number
          moment_types_enabled?: Json
          sensitivity_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_clip_enabled?: boolean
          clip_after_seconds?: number
          clip_before_seconds?: number
          clip_duration_overrides?: Json
          clip_duration_seconds?: number
          confidence_threshold?: number
          created_at?: string
          detection_interval_seconds?: number
          id?: string
          layers_enabled?: Json
          max_clips_per_stream?: number
          moment_types_enabled?: Json
          sensitivity_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_clips: {
        Row: {
          approved_at: string | null
          award_category_id: string | null
          branding_applied: boolean
          category: string
          created_at: string
          delivered_at: string | null
          dimensions: string
          download_url: string | null
          duration_label: string | null
          editor_overrides: Json
          end_offset_seconds: number | null
          error_message: string | null
          event_id: string | null
          format: string
          format_label: string
          id: string
          livepeer_asset_id: string | null
          livepeer_playback_id: string | null
          moment_id: string | null
          music_track: string | null
          parent_clip_id: string | null
          preview_url: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          rejected_at: string | null
          source_video_url: string | null
          start_offset_seconds: number | null
          status: string
          template_id: string | null
          trigger_timestamp: string | null
          updated_at: string
          user_id: string
          winner_name: string
        }
        Insert: {
          approved_at?: string | null
          award_category_id?: string | null
          branding_applied?: boolean
          category: string
          created_at?: string
          delivered_at?: string | null
          dimensions: string
          download_url?: string | null
          duration_label?: string | null
          editor_overrides?: Json
          end_offset_seconds?: number | null
          error_message?: string | null
          event_id?: string | null
          format: string
          format_label: string
          id?: string
          livepeer_asset_id?: string | null
          livepeer_playback_id?: string | null
          moment_id?: string | null
          music_track?: string | null
          parent_clip_id?: string | null
          preview_url?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          rejected_at?: string | null
          source_video_url?: string | null
          start_offset_seconds?: number | null
          status?: string
          template_id?: string | null
          trigger_timestamp?: string | null
          updated_at?: string
          user_id: string
          winner_name: string
        }
        Update: {
          approved_at?: string | null
          award_category_id?: string | null
          branding_applied?: boolean
          category?: string
          created_at?: string
          delivered_at?: string | null
          dimensions?: string
          download_url?: string | null
          duration_label?: string | null
          editor_overrides?: Json
          end_offset_seconds?: number | null
          error_message?: string | null
          event_id?: string | null
          format?: string
          format_label?: string
          id?: string
          livepeer_asset_id?: string | null
          livepeer_playback_id?: string | null
          moment_id?: string | null
          music_track?: string | null
          parent_clip_id?: string | null
          preview_url?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          rejected_at?: string | null
          source_video_url?: string | null
          start_offset_seconds?: number | null
          status?: string
          template_id?: string | null
          trigger_timestamp?: string | null
          updated_at?: string
          user_id?: string
          winner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_clips_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "detected_moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_clips_parent_clip_id_fkey"
            columns: ["parent_clip_id"]
            isOneToOne: false
            referencedRelation: "generated_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      room_chat_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "stream_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries: {
        Row: {
          clips_created: number | null
          created_at: string
          id: string
          moments_detected: number | null
          peak_viewers: number | null
          room_id: string
          stream_end: string | null
          stream_start: string | null
          user_id: string
        }
        Insert: {
          clips_created?: number | null
          created_at?: string
          id?: string
          moments_detected?: number | null
          peak_viewers?: number | null
          room_id: string
          stream_end?: string | null
          stream_start?: string | null
          user_id: string
        }
        Update: {
          clips_created?: number | null
          created_at?: string
          id?: string
          moments_detected?: number | null
          peak_viewers?: number | null
          room_id?: string
          stream_end?: string | null
          stream_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "stream_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_room_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "stream_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_rooms: {
        Row: {
          branding_json: Json
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          event_date: string | null
          id: string
          livepeer_playback_id: string | null
          livepeer_stream_id: string | null
          livepeer_stream_key: string | null
          name: string
          rtmp_url: string | null
          started_at: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          venue: string | null
        }
        Insert: {
          branding_json?: Json
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          event_date?: string | null
          id?: string
          livepeer_playback_id?: string | null
          livepeer_stream_id?: string | null
          livepeer_stream_key?: string | null
          name?: string
          rtmp_url?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          venue?: string | null
        }
        Update: {
          branding_json?: Json
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          event_date?: string | null
          id?: string
          livepeer_playback_id?: string | null
          livepeer_stream_id?: string | null
          livepeer_stream_key?: string | null
          name?: string
          rtmp_url?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          venue?: string | null
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          created_at: string
          end_seconds: number
          id: string
          start_seconds: number
          stream_room_id: string
          text: string
          user_id: string
          words_json: Json | null
        }
        Insert: {
          created_at?: string
          end_seconds: number
          id?: string
          start_seconds: number
          stream_room_id: string
          text: string
          user_id: string
          words_json?: Json | null
        }
        Update: {
          created_at?: string
          end_seconds?: number
          id?: string
          start_seconds?: number
          stream_room_id?: string
          text?: string
          user_id?: string
          words_json?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          invited_email: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_first_user_owner: {
        Args: { _email: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "staff"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
      subscription_tier: "free" | "starter" | "pro" | "enterprise"
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
      app_role: ["owner", "admin", "staff"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
      ],
      subscription_tier: ["free", "starter", "pro", "enterprise"],
    },
  },
} as const
