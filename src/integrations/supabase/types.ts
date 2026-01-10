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
      breaking_news: {
        Row: {
          country_code: string | null
          created_at: string
          expires_at: string
          headline: string
          id: string
          image_url: string | null
          is_active: boolean
          source_name: string | null
          source_url: string | null
          summary: string | null
          topic_slug: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          expires_at?: string
          headline: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          topic_slug?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          expires_at?: string
          headline?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          topic_slug?: string | null
        }
        Relationships: []
      }
      cached_news: {
        Row: {
          articles: Json
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          source: string
          total: number
        }
        Insert: {
          articles: Json
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          source?: string
          total?: number
        }
        Update: {
          articles?: Json
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          source?: string
          total?: number
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          default_language: string | null
          flag_emoji: string | null
          name: string
          native_name: string | null
        }
        Insert: {
          code: string
          default_language?: string | null
          flag_emoji?: string | null
          name: string
          native_name?: string | null
        }
        Update: {
          code?: string
          default_language?: string | null
          flag_emoji?: string | null
          name?: string
          native_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countries_default_language_fkey"
            columns: ["default_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      discussion_reactions: {
        Row: {
          anonymous_id: string | null
          created_at: string
          discussion_id: string
          id: string
          reaction_type: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          discussion_id: string
          id?: string
          reaction_type: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          discussion_id?: string
          id?: string
          reaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_reactions_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          agrees_count: number | null
          author_name: string | null
          content_id: string
          content_type: string
          created_at: string
          disagrees_count: number | null
          id: string
          is_hidden: boolean | null
          message: string
          reported_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agrees_count?: number | null
          author_name?: string | null
          content_id: string
          content_type: string
          created_at?: string
          disagrees_count?: number | null
          id?: string
          is_hidden?: boolean | null
          message: string
          reported_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agrees_count?: number | null
          author_name?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          disagrees_count?: number | null
          id?: string
          is_hidden?: boolean | null
          message?: string
          reported_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          donation_type: string | null
          email: string | null
          id: string
          order_id: string | null
          payment_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          donation_type?: string | null
          email?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          donation_type?: string | null
          email?: string | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          direction: string | null
          name: string
          native_name: string
        }
        Insert: {
          code: string
          direction?: string | null
          name: string
          native_name: string
        }
        Update: {
          code?: string
          direction?: string | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          ai_analysis: string | null
          audio_url: string | null
          content: string | null
          country_code: string | null
          created_at: string
          headline: string
          id: string
          image_url: string | null
          is_breaking: boolean | null
          is_global: boolean | null
          language_code: string | null
          likes_count: number | null
          listens_count: number | null
          perspectives: Json | null
          published_at: string | null
          sentiment: string | null
          source_logo: string | null
          source_name: string | null
          source_url: string | null
          summary: string | null
          topic_id: string | null
          trust_score: number | null
          updated_at: string
          views_count: number | null
          why_matters: string | null
        }
        Insert: {
          ai_analysis?: string | null
          audio_url?: string | null
          content?: string | null
          country_code?: string | null
          created_at?: string
          headline: string
          id?: string
          image_url?: string | null
          is_breaking?: boolean | null
          is_global?: boolean | null
          language_code?: string | null
          likes_count?: number | null
          listens_count?: number | null
          perspectives?: Json | null
          published_at?: string | null
          sentiment?: string | null
          source_logo?: string | null
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          topic_id?: string | null
          trust_score?: number | null
          updated_at?: string
          views_count?: number | null
          why_matters?: string | null
        }
        Update: {
          ai_analysis?: string | null
          audio_url?: string | null
          content?: string | null
          country_code?: string | null
          created_at?: string
          headline?: string
          id?: string
          image_url?: string | null
          is_breaking?: boolean | null
          is_global?: boolean | null
          language_code?: string | null
          likes_count?: number | null
          listens_count?: number | null
          perspectives?: Json | null
          published_at?: string | null
          sentiment?: string | null
          source_logo?: string | null
          source_name?: string | null
          source_url?: string | null
          summary?: string | null
          topic_id?: string | null
          trust_score?: number | null
          updated_at?: string
          views_count?: number | null
          why_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "news_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "news_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language_code: string | null
          phone: string | null
          preferred_mode: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language_code?: string | null
          phone?: string | null
          preferred_mode?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language_code?: string | null
          phone?: string | null
          preferred_mode?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "profiles_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      saved_news: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_news_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_places: {
        Row: {
          created_at: string
          id: string
          liked: boolean | null
          place_address: string | null
          place_id: string
          place_image_url: string | null
          place_lat: number | null
          place_lng: number | null
          place_name: string
          place_rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked?: boolean | null
          place_address?: string | null
          place_id: string
          place_image_url?: string | null
          place_lat?: number | null
          place_lng?: number | null
          place_name: string
          place_rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked?: boolean | null
          place_address?: string | null
          place_id?: string
          place_image_url?: string | null
          place_lat?: number | null
          place_lng?: number | null
          place_name?: string
          place_rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_news_interactions: {
        Row: {
          created_at: string
          id: string
          liked: boolean | null
          listened: boolean | null
          news_id: string
          read_time_seconds: number | null
          saved: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked?: boolean | null
          listened?: boolean | null
          news_id: string
          read_time_seconds?: number | null
          saved?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked?: boolean | null
          listened?: boolean | null
          news_id?: string
          read_time_seconds?: number | null
          saved?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_news_interactions_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      user_topic_preferences: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_preferences_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
