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
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          role?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
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
      click_events: {
        Row: {
          created_at: string
          element_id: string | null
          element_text: string | null
          element_type: string | null
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string | null
          user_id: string | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          element_text?: string | null
          element_type?: string | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          created_at?: string
          element_id?: string | null
          element_text?: string | null
          element_type?: string | null
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
          x_position?: number | null
          y_position?: number | null
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
      cron_job_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          job_name: string
          metadata: Json | null
          records_processed: number | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          records_processed?: number | null
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          records_processed?: number | null
          status?: string
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
          premium_granted: boolean | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string | null
          subscription_months: number | null
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
          premium_granted?: boolean | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string | null
          subscription_months?: number | null
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
          premium_granted?: boolean | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string | null
          subscription_months?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ingestion_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          error_step: string | null
          id: string
          started_at: string
          status: string
          step_classify: string | null
          step_classify_count: number | null
          step_cleanup: string | null
          step_cleanup_deleted: number | null
          step_dedupe: string | null
          step_dedupe_merged: number | null
          step_fetch_feeds: string | null
          step_fetch_feeds_count: number | null
          step_normalize: string | null
          step_normalize_count: number | null
          step_store: string | null
          step_store_created: number | null
          step_validate: string | null
          step_validate_rejected: number | null
          tier1_feeds: number | null
          tier2_feeds: number | null
          tier3_feeds: number | null
          total_feeds_processed: number | null
          total_stories_created: number | null
          total_stories_merged: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          error_step?: string | null
          id?: string
          started_at?: string
          status?: string
          step_classify?: string | null
          step_classify_count?: number | null
          step_cleanup?: string | null
          step_cleanup_deleted?: number | null
          step_dedupe?: string | null
          step_dedupe_merged?: number | null
          step_fetch_feeds?: string | null
          step_fetch_feeds_count?: number | null
          step_normalize?: string | null
          step_normalize_count?: number | null
          step_store?: string | null
          step_store_created?: number | null
          step_validate?: string | null
          step_validate_rejected?: number | null
          tier1_feeds?: number | null
          tier2_feeds?: number | null
          tier3_feeds?: number | null
          total_feeds_processed?: number | null
          total_stories_created?: number | null
          total_stories_merged?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          error_step?: string | null
          id?: string
          started_at?: string
          status?: string
          step_classify?: string | null
          step_classify_count?: number | null
          step_cleanup?: string | null
          step_cleanup_deleted?: number | null
          step_dedupe?: string | null
          step_dedupe_merged?: number | null
          step_fetch_feeds?: string | null
          step_fetch_feeds_count?: number | null
          step_normalize?: string | null
          step_normalize_count?: number | null
          step_store?: string | null
          step_store_created?: number | null
          step_validate?: string | null
          step_validate_rejected?: number | null
          tier1_feeds?: number | null
          tier2_feeds?: number | null
          tier3_feeds?: number | null
          total_feeds_processed?: number | null
          total_stories_created?: number | null
          total_stories_merged?: number | null
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
      newsletter_popup_events: {
        Row: {
          created_at: string
          email: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          popup_trigger_minute: number | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          popup_trigger_minute?: number | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          popup_trigger_minute?: number | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
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
      newsroom_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["newsroom_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["newsroom_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["newsroom_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          page_path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
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
          is_premium: boolean | null
          language_code: string | null
          phone: string | null
          preferred_mode: string | null
          premium_expires_at: string | null
          premium_features: Json | null
          subscription_tier: string | null
          total_donations: number | null
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
          is_premium?: boolean | null
          language_code?: string | null
          phone?: string | null
          preferred_mode?: string | null
          premium_expires_at?: string | null
          premium_features?: Json | null
          subscription_tier?: string | null
          total_donations?: number | null
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
          is_premium?: boolean | null
          language_code?: string | null
          phone?: string | null
          preferred_mode?: string | null
          premium_expires_at?: string | null
          premium_features?: Json | null
          subscription_tier?: string | null
          total_donations?: number | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          category: string | null
          country_code: string | null
          created_at: string
          fetch_interval_minutes: number | null
          id: string
          is_active: boolean | null
          language: string | null
          last_fetched_at: string | null
          name: string
          priority: number | null
          publisher: string | null
          reliability_tier: string | null
          source_type: string | null
          url: string
        }
        Insert: {
          category?: string | null
          country_code?: string | null
          created_at?: string
          fetch_interval_minutes?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          name: string
          priority?: number | null
          publisher?: string | null
          reliability_tier?: string | null
          source_type?: string | null
          url: string
        }
        Update: {
          category?: string | null
          country_code?: string | null
          created_at?: string
          fetch_interval_minutes?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          name?: string
          priority?: number | null
          publisher?: string | null
          reliability_tier?: string | null
          source_type?: string | null
          url?: string
        }
        Relationships: []
      }
      rss_ingestion_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          feed_id: string | null
          feed_name: string | null
          feed_url: string | null
          id: string
          status: string
          stories_fetched: number | null
          stories_inserted: number | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          feed_id?: string | null
          feed_name?: string | null
          feed_url?: string | null
          id?: string
          status: string
          stories_fetched?: number | null
          stories_inserted?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          feed_id?: string | null
          feed_name?: string | null
          feed_url?: string | null
          id?: string
          status?: string
          stories_fetched?: number | null
          stories_inserted?: number | null
        }
        Relationships: []
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
        Relationships: []
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
      stories: {
        Row: {
          ai_summary: string | null
          category: string | null
          city: string | null
          confidence_level: string | null
          country_code: string | null
          created_at: string
          engagement_listens: number | null
          engagement_reads: number | null
          engagement_saves: number | null
          first_published_at: string
          has_contradictions: boolean | null
          headline: string
          id: string
          image_url: string | null
          is_global: boolean | null
          last_updated_at: string
          normalized_headline: string
          primary_source_count: number | null
          source_count: number | null
          story_hash: string
          story_state: string | null
          summary: string | null
          trend_score: number | null
          verified_source_count: number | null
        }
        Insert: {
          ai_summary?: string | null
          category?: string | null
          city?: string | null
          confidence_level?: string | null
          country_code?: string | null
          created_at?: string
          engagement_listens?: number | null
          engagement_reads?: number | null
          engagement_saves?: number | null
          first_published_at?: string
          has_contradictions?: boolean | null
          headline: string
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          last_updated_at?: string
          normalized_headline: string
          primary_source_count?: number | null
          source_count?: number | null
          story_hash: string
          story_state?: string | null
          summary?: string | null
          trend_score?: number | null
          verified_source_count?: number | null
        }
        Update: {
          ai_summary?: string | null
          category?: string | null
          city?: string | null
          confidence_level?: string | null
          country_code?: string | null
          created_at?: string
          engagement_listens?: number | null
          engagement_reads?: number | null
          engagement_saves?: number | null
          first_published_at?: string
          has_contradictions?: boolean | null
          headline?: string
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          last_updated_at?: string
          normalized_headline?: string
          primary_source_count?: number | null
          source_count?: number | null
          story_hash?: string
          story_state?: string | null
          summary?: string | null
          trend_score?: number | null
          verified_source_count?: number | null
        }
        Relationships: []
      }
      story_sources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_primary_reporting: boolean | null
          published_at: string
          reliability_tier: string | null
          source_name: string
          source_type: string | null
          source_url: string
          story_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_primary_reporting?: boolean | null
          published_at: string
          reliability_tier?: string | null
          source_name: string
          source_type?: string | null
          source_url: string
          story_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_primary_reporting?: boolean | null
          published_at?: string
          reliability_tier?: string | null
          source_name?: string
          source_type?: string | null
          source_url?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_sources_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
      get_newsroom_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["newsroom_role"]
      }
      has_newsroom_access: {
        Args: {
          _min_role: Database["public"]["Enums"]["newsroom_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_newsroom_owner_or_superadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      newsroom_role: "owner" | "superadmin" | "admin" | "editor" | "viewer"
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
      newsroom_role: ["owner", "superadmin", "admin", "editor", "viewer"],
    },
  },
} as const
