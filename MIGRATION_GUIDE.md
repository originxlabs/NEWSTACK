# NEWSTACK — Complete Migration Guide

**Product of ORIGINX LABS**
**Last Updated:** February 2026

This document contains everything needed to migrate NEWSTACK from Lovable Cloud to a local development environment with your own Supabase project.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Export the Codebase](#3-step-1-export-the-codebase)
4. [Step 2: Set Up Local Development](#4-step-2-set-up-local-development)
5. [Step 3: Create Your Own Supabase Project](#5-step-3-create-your-own-supabase-project)
6. [Step 4: Database Schema (All Tables)](#6-step-4-database-schema-all-tables)
7. [Step 5: Database Functions & Triggers](#7-step-5-database-functions--triggers)
8. [Step 6: Row-Level Security (RLS) Policies](#8-step-6-row-level-security-rls-policies)
9. [Step 7: Cron Jobs (pg_cron)](#9-step-7-cron-jobs-pg_cron)
10. [Step 8: Edge Functions](#10-step-8-edge-functions)
11. [Step 9: Secrets / Environment Variables](#11-step-9-secrets--environment-variables)
12. [Step 10: RSS Feed Sources (Complete List)](#12-step-10-rss-feed-sources)
13. [Step 11: Frontend Configuration](#13-step-11-frontend-configuration)
14. [Step 12: Deployment](#14-step-12-deployment)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────┐
│                  FRONTEND                    │
│  React 18 + TypeScript + Vite + Tailwind CSS │
│  + shadcn/ui + Framer Motion                 │
│  PWA with Service Worker                     │
└───────────────┬──────────────────────────────┘
                │ HTTPS
┌───────────────▼──────────────────────────────┐
│            SUPABASE (Backend)                │
│  ┌─────────────┐  ┌──────────────────┐       │
│  │  PostgreSQL  │  │  Edge Functions  │       │
│  │  (Database)  │  │  (Deno Runtime)  │       │
│  └─────────────┘  └──────────────────┘       │
│  ┌─────────────┐  ┌──────────────────┐       │
│  │  Auth        │  │  Realtime        │       │
│  │  (Email/OTP) │  │  (WebSockets)    │       │
│  └─────────────┘  └──────────────────┘       │
│  ┌─────────────┐  ┌──────────────────┐       │
│  │  pg_cron     │  │  pg_net          │       │
│  │  (Scheduler) │  │  (HTTP calls)    │       │
│  └─────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────┘
```

**Key flows:**
- **RSS Ingestion**: pg_cron triggers `ingest-rss` edge function every 15 minutes → fetches RSS feeds → normalizes/dedupes → stores in `stories` + `story_sources` tables
- **Daily Digest**: pg_cron triggers `send-daily-digest` at 7:00 AM IST → fetches top stories → sends email via Resend API
- **News API**: `get-stories` edge function serves news to the frontend
- **Push Notifications**: Supabase Realtime listens for new verified stories → sends Web Push notifications

---

## 2. Prerequisites

- **Node.js** 18+ and **npm/bun**
- **Git**
- **Supabase account** (https://supabase.com)
- **Supabase CLI** (`npm install -g supabase`)
- **Deno** (for edge function local testing)
- API keys for external services (see Section 9)

---

## 3. Step 1: Export the Codebase

### Option A: From Lovable GitHub Integration
1. In Lovable, go to **Settings → Connectors → GitHub**
2. Connect GitHub and push the project
3. Clone: `git clone https://github.com/YOUR_ORG/newstack.git`

### Option B: Download from Lovable
1. In Lovable, click the project name → **Settings → Download ZIP**
2. Extract and initialize: `cd newstack && git init`

---

## 4. Step 2: Set Up Local Development

```bash
# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
EOF

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 5. Step 3: Create Your Own Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose an organization, name it `newstack`, pick a region close to your users
4. Note your:
   - **Project URL**: `https://YOUR_REF.supabase.co`
   - **Anon Key**: (Settings → API → `anon` `public` key)
   - **Service Role Key**: (Settings → API → `service_role` key — KEEP SECRET)

### Enable Required Extensions

Go to **Database → Extensions** and enable:
- `pg_cron` — for scheduled tasks
- `pg_net` — for HTTP calls from SQL
- `pgcrypto` — for UUID generation (usually enabled by default)

---

## 6. Step 4: Database Schema (All Tables)

Run all the following SQL in **Supabase SQL Editor** (Dashboard → SQL Editor → New Query).

### 6.1 Custom Types

```sql
-- Newsroom role enum
CREATE TYPE public.newsroom_role AS ENUM ('owner', 'superadmin', 'admin', 'editor', 'viewer');
```

### 6.2 Core Tables

```sql
-- ========== LANGUAGES ==========
CREATE TABLE public.languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  direction text DEFAULT 'ltr'
);

-- ========== COUNTRIES ==========
CREATE TABLE public.countries (
  code text PRIMARY KEY,
  name text NOT NULL,
  native_name text,
  flag_emoji text,
  default_language text REFERENCES public.languages(code)
);

-- ========== TOPICS ==========
CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text,
  description text,
  color text
);

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  phone text,
  display_name text,
  avatar_url text,
  country_code text REFERENCES public.countries(code),
  language_code text DEFAULT 'en' REFERENCES public.languages(code),
  preferred_mode text DEFAULT 'read',
  subscription_tier text DEFAULT 'free',
  is_premium boolean DEFAULT false,
  premium_expires_at timestamptz,
  premium_features jsonb DEFAULT '{}'::jsonb,
  total_donations integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== STORIES ==========
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_hash text NOT NULL,
  headline text NOT NULL,
  normalized_headline text NOT NULL,
  summary text,
  ai_summary text,
  category text DEFAULT 'world',
  country_code text,
  state text,
  city text,
  district text,
  locality text,
  is_global boolean DEFAULT true,
  first_published_at timestamptz NOT NULL DEFAULT now(),
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  source_count integer DEFAULT 1,
  primary_source_count integer DEFAULT 0,
  verified_source_count integer DEFAULT 0,
  has_contradictions boolean DEFAULT false,
  trend_score numeric DEFAULT 0,
  image_url text,
  story_state text DEFAULT 'single_source',
  confidence_level text DEFAULT 'low',
  engagement_reads integer DEFAULT 0,
  engagement_listens integer DEFAULT 0,
  engagement_saves integer DEFAULT 0,
  original_headline text,
  original_summary text,
  original_language varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== STORY SOURCES ==========
CREATE TABLE public.story_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  source_url text NOT NULL,
  description text,
  source_type text DEFAULT 'secondary',
  reliability_tier text DEFAULT 'tier_2',
  is_primary_reporting boolean DEFAULT false,
  published_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== RSS FEEDS ==========
CREATE TABLE public.rss_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  category text DEFAULT 'world',
  country_code text,
  state_id text,
  language text DEFAULT 'en',
  source_type text DEFAULT 'secondary',
  reliability_tier text DEFAULT 'tier_2',
  publisher text,
  priority integer DEFAULT 50,
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  fetch_interval_minutes integer DEFAULT 30,
  error_count integer DEFAULT 0,
  total_fetch_count integer DEFAULT 0,
  avg_stories_per_fetch numeric DEFAULT 0,
  last_error_at timestamptz,
  last_error_message text,
  health_score integer DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== RSS INGESTION LOGS ==========
CREATE TABLE public.rss_ingestion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid,
  feed_name text,
  feed_url text,
  status text NOT NULL,
  stories_fetched integer DEFAULT 0,
  stories_inserted integer DEFAULT 0,
  duration_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== INGESTION RUNS ==========
CREATE TABLE public.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  step_fetch_feeds text DEFAULT 'pending',
  step_fetch_feeds_count integer DEFAULT 0,
  step_normalize text DEFAULT 'pending',
  step_normalize_count integer DEFAULT 0,
  step_validate text DEFAULT 'pending',
  step_validate_rejected integer DEFAULT 0,
  step_classify text DEFAULT 'pending',
  step_classify_count integer DEFAULT 0,
  step_dedupe text DEFAULT 'pending',
  step_dedupe_merged integer DEFAULT 0,
  step_store text DEFAULT 'pending',
  step_store_created integer DEFAULT 0,
  step_cleanup text DEFAULT 'pending',
  step_cleanup_deleted integer DEFAULT 0,
  tier1_feeds integer DEFAULT 0,
  tier2_feeds integer DEFAULT 0,
  tier3_feeds integer DEFAULT 0,
  total_feeds_processed integer DEFAULT 0,
  total_stories_created integer DEFAULT 0,
  total_stories_merged integer DEFAULT 0,
  error_message text,
  error_step text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== FEED FETCH RESULTS ==========
CREATE TABLE public.feed_fetch_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_run_id uuid REFERENCES public.ingestion_runs(id),
  feed_id uuid REFERENCES public.rss_feeds(id),
  feed_name text NOT NULL,
  status text DEFAULT 'pending',
  stories_fetched integer DEFAULT 0,
  stories_inserted integer DEFAULT 0,
  duration_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== INGESTION ACCESS USERS ==========
CREATE TABLE public.ingestion_access_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  ip_address text,
  user_agent text,
  device_info jsonb,
  location jsonb,
  terms_accepted boolean DEFAULT false,
  cookie_policy_accepted boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  otp_verified_at timestamptz,
  last_ingestion_at timestamptz,
  total_ingestions integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== INGESTION USER LOGS ==========
CREATE TABLE public.ingestion_user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  access_user_id uuid REFERENCES public.ingestion_access_users(id),
  user_email text,
  ingestion_run_id uuid REFERENCES public.ingestion_runs(id),
  trigger_type text NOT NULL DEFAULT 'manual',
  ip_address text,
  user_agent text,
  country_code text,
  province_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== BREAKING NEWS ==========
CREATE TABLE public.breaking_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  summary text,
  source_name text,
  source_url text,
  image_url text,
  topic_slug text DEFAULT 'world',
  country_code text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== NEWSLETTER SUBSCRIBERS ==========
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- ========== NEWSLETTER POPUP EVENTS ==========
CREATE TABLE public.newsletter_popup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  session_id text,
  email text,
  page_url text,
  referrer text,
  user_agent text,
  popup_trigger_minute integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== EMAIL OTPS ==========
CREATE TABLE public.email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL DEFAULT 'login',
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== PUSH SUBSCRIPTIONS ==========
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== SAVED NEWS ==========
CREATE TABLE public.saved_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  news_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== SAVED PLACES ==========
CREATE TABLE public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  place_id text NOT NULL,
  place_name text NOT NULL,
  place_address text,
  place_image_url text,
  place_lat double precision,
  place_lng double precision,
  place_rating double precision,
  liked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== USER NEWS INTERACTIONS ==========
CREATE TABLE public.user_news_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  news_id uuid NOT NULL,
  liked boolean DEFAULT false,
  saved boolean DEFAULT false,
  listened boolean DEFAULT false,
  read_time_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== USER TOPIC PREFERENCES ==========
CREATE TABLE public.user_topic_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.topics(id),
  weight integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== DONATIONS ==========
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  amount integer NOT NULL,
  currency text DEFAULT 'INR',
  payment_id text,
  order_id text,
  status text DEFAULT 'pending',
  donation_type text DEFAULT 'one-time',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  subscription_months integer DEFAULT 0,
  premium_granted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== ADMIN USERS ==========
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== NEWSROOM MEMBERS ==========
CREATE TABLE public.newsroom_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  role newsroom_role NOT NULL DEFAULT 'viewer',
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid,
  password_last_set_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== OWNER ACCESS LOGS ==========
CREATE TABLE public.owner_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  event_type text NOT NULL,
  success boolean DEFAULT false,
  ip_address text,
  user_agent text,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== CRON JOB LOGS ==========
CREATE TABLE public.cron_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL,
  duration_ms integer,
  records_processed integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== PAGE VIEWS ==========
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  page_path text NOT NULL,
  session_id text,
  referrer text,
  user_agent text,
  country text,
  device_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== CLICK EVENTS ==========
CREATE TABLE public.click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  element_id text,
  element_type text,
  element_text text,
  page_path text,
  x_position integer,
  y_position integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== API KEYS ==========
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  api_key text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'starter',
  is_active boolean NOT NULL DEFAULT true,
  is_sandbox boolean NOT NULL DEFAULT false,
  requests_limit integer NOT NULL DEFAULT 100000,
  requests_used integer NOT NULL DEFAULT 0,
  rate_limit_per_second integer NOT NULL DEFAULT 10,
  allowed_endpoints text[] DEFAULT ARRAY['news'],
  enterprise_id text,
  subscription_id uuid,
  created_by uuid,
  notes text,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== ENTERPRISE SUBSCRIPTIONS ==========
CREATE TABLE public.enterprise_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enterprise_id text,
  plan_type text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'pending',
  billing_cycle text,
  price_paid numeric,
  currency text,
  razorpay_order_id text,
  razorpay_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  api_key_id uuid REFERENCES public.api_keys(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK from api_keys to enterprise_subscriptions
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES public.enterprise_subscriptions(id);

-- ========== API USAGE TRACKING ==========
CREATE TABLE public.api_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id),
  endpoint text NOT NULL,
  method text DEFAULT 'GET',
  status_code integer,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  user_id uuid,
  enterprise_id text,
  is_sandbox boolean DEFAULT true,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  request_hour integer DEFAULT EXTRACT(hour FROM now()),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== API USAGE DAILY ==========
CREATE TABLE public.api_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id),
  usage_date date NOT NULL,
  total_requests integer DEFAULT 0,
  successful_requests integer DEFAULT 0,
  failed_requests integer DEFAULT 0,
  avg_response_time_ms integer DEFAULT 0,
  news_requests integer DEFAULT 0,
  world_requests integer DEFAULT 0,
  places_requests integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== API KEY USAGE LOGS ==========
CREATE TABLE public.api_key_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id),
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  status_code integer,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== WEBHOOK SUBSCRIPTIONS ==========
CREATE TABLE public.webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id),
  webhook_url text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['story.created'],
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  retry_count integer NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  last_status_code integer,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== WEBHOOK DELIVERY LOGS ==========
CREATE TABLE public.webhook_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.webhook_subscriptions(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status_code integer,
  response_body text,
  error_message text,
  delivery_time_ms integer,
  attempt_number integer NOT NULL DEFAULT 1,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Realtime on stories table (for push notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
```

---

## 7. Step 5: Database Functions & Triggers

```sql
-- ========== FUNCTIONS ==========

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.phone);
  RETURN NEW;
END;
$$;

-- Trigger: auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Calculate trend score
CREATE OR REPLACE FUNCTION public.calculate_trend_score()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.trend_score := (
    (NEW.source_count * 10 * 0.5) +
    (GREATEST(0, 100 - EXTRACT(EPOCH FROM (now() - NEW.first_published_at)) / 3600) * 0.3) +
    ((NEW.engagement_reads + NEW.engagement_listens * 2 + NEW.engagement_saves * 3) * 0.2)
  );
  RETURN NEW;
END;
$$;

-- Newsroom role helpers
CREATE OR REPLACE FUNCTION public.get_newsroom_role(_user_id uuid)
RETURNS newsroom_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT role FROM public.newsroom_members
  WHERE user_id = _user_id AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_newsroom_access(_user_id uuid, _min_role newsroom_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.newsroom_members
    WHERE user_id = _user_id AND is_active = true AND (
      role = 'owner' OR
      (role = 'superadmin' AND _min_role IN ('superadmin','admin','editor','viewer')) OR
      (role = 'admin' AND _min_role IN ('admin','editor','viewer')) OR
      (role = 'editor' AND _min_role IN ('editor','viewer')) OR
      (role = 'viewer' AND _min_role = 'viewer')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_newsroom_owner_or_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.newsroom_members
    WHERE user_id = _user_id AND is_active = true AND role IN ('owner','superadmin')
  );
$$;

-- API key generation
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE key_suffix TEXT;
BEGIN
  key_suffix := encode(gen_random_bytes(24), 'base64');
  key_suffix := replace(replace(replace(key_suffix, '+', ''), '/', ''), '=', '');
  RETURN 'nsk_' || substring(key_suffix from 1 for 32);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_enterprise_id()
RETURNS text LANGUAGE plpgsql AS $$
BEGIN RETURN 'ENT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)); END;
$$;

CREATE OR REPLACE FUNCTION public.generate_webhook_secret()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN 'whsec_' || encode(gen_random_bytes(32), 'hex'); END;
$$;

CREATE OR REPLACE FUNCTION public.increment_api_usage(key_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE public.api_keys SET requests_used = requests_used + 1 WHERE id = key_id; END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM public.email_otps WHERE expires_at < now(); END;
$$;
```

---

## 8. Step 6: Row-Level Security (RLS) Policies

Enable RLS on all tables, then apply these policies:

```sql
-- Enable RLS on all tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_news_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_popup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_access_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_fetch_results ENABLE ROW LEVEL SECURITY;

-- ===== PUBLIC READ tables =====
CREATE POLICY "Stories are publicly readable" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Story sources are publicly readable" ON public.story_sources FOR SELECT USING (true);
CREATE POLICY "RSS feeds are publicly readable" ON public.rss_feeds FOR SELECT USING (true);
CREATE POLICY "Topics are publicly readable" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Countries are publicly readable" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Languages are publicly readable" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Public can read ingestion runs" ON public.ingestion_runs FOR SELECT USING (true);
CREATE POLICY "Anyone can read breaking news" ON public.breaking_news FOR SELECT USING (is_active = true AND expires_at > now());

-- ===== USER-OWNED data =====
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their saved news" ON public.saved_news FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save news" ON public.saved_news FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave news" ON public.saved_news FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved places" ON public.saved_places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save places" ON public.saved_places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their saved places" ON public.saved_places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their saved places" ON public.saved_places FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their interactions" ON public.user_news_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create interactions" ON public.user_news_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their interactions" ON public.user_news_interactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their topic preferences" ON public.user_topic_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their topic preferences" ON public.user_topic_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their topic preferences" ON public.user_topic_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their topic preferences" ON public.user_topic_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create donations" ON public.donations FOR INSERT WITH CHECK (true);

-- ===== PUSH & NEWSLETTER =====
CREATE POLICY "Anyone can insert push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their subscriptions" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can update their subscriptions" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create popup events" ON public.newsletter_popup_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read popup events" ON public.newsletter_popup_events FOR SELECT USING (true);

-- ===== INGESTION =====
CREATE POLICY "Public can insert access users" ON public.ingestion_access_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own data" ON public.ingestion_access_users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON public.ingestion_access_users FOR UPDATE USING (true);
CREATE POLICY "Service role can insert ingestion logs" ON public.ingestion_user_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Newsroom owners can view ingestion logs" ON public.ingestion_user_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM newsroom_members WHERE user_id = auth.uid() AND role IN ('owner','superadmin') AND is_active = true)
);

-- ===== ADMIN/NEWSROOM =====
CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users au WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);
CREATE POLICY "Owners and superadmins can view all members" ON public.newsroom_members FOR SELECT USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owners can insert members" ON public.newsroom_members FOR INSERT WITH CHECK (get_newsroom_role(auth.uid()) = 'owner');
CREATE POLICY "Owners can update members" ON public.newsroom_members FOR UPDATE USING (get_newsroom_role(auth.uid()) = 'owner');
CREATE POLICY "Owners can delete members" ON public.newsroom_members FOR DELETE USING (get_newsroom_role(auth.uid()) = 'owner');

-- ===== API KEYS =====
CREATE POLICY "Owner and superadmin can view API keys" ON public.api_keys FOR SELECT USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can create API keys" ON public.api_keys FOR INSERT WITH CHECK (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can update API keys" ON public.api_keys FOR UPDATE USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can delete API keys" ON public.api_keys FOR DELETE USING (is_newsroom_owner_or_superadmin(auth.uid()));

-- ===== WEBHOOKS =====
CREATE POLICY "Owner and superadmin can view webhook subscriptions" ON public.webhook_subscriptions FOR SELECT USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can create webhook subscriptions" ON public.webhook_subscriptions FOR INSERT WITH CHECK (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can update webhook subscriptions" ON public.webhook_subscriptions FOR UPDATE USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can delete webhook subscriptions" ON public.webhook_subscriptions FOR DELETE USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can view webhook delivery logs" ON public.webhook_delivery_logs FOR SELECT USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owner and superadmin can view usage logs" ON public.api_key_usage_logs FOR SELECT USING (is_newsroom_owner_or_superadmin(auth.uid()));

-- ===== ANALYTICS =====
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view page views" ON public.page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users au WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);
CREATE POLICY "Anyone can insert click events" ON public.click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view click events" ON public.click_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users au WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);

-- ===== CRON/INGESTION LOGS =====
CREATE POLICY "System can insert cron logs" ON public.cron_job_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view cron logs" ON public.cron_job_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users au WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);
CREATE POLICY "System can insert ingestion logs" ON public.rss_ingestion_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view ingestion logs" ON public.rss_ingestion_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users au WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);

-- ===== RSS FEEDS ADMIN =====
CREATE POLICY "Owners and superadmins can insert feeds" ON public.rss_feeds FOR INSERT WITH CHECK (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owners and superadmins can update feeds" ON public.rss_feeds FOR UPDATE USING (is_newsroom_owner_or_superadmin(auth.uid()));
CREATE POLICY "Owners and superadmins can delete feeds" ON public.rss_feeds FOR DELETE USING (is_newsroom_owner_or_superadmin(auth.uid()));

-- ===== OWNER ACCESS LOGS =====
CREATE POLICY "Anyone can insert audit logs" ON public.owner_access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Only owners can view audit logs" ON public.owner_access_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM newsroom_members WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true)
);

-- ===== API USAGE =====
CREATE POLICY "Users can view usage for their API keys" ON public.api_usage_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM api_keys WHERE id = api_usage_tracking.api_key_id AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);
CREATE POLICY "Users can view daily usage for their API keys" ON public.api_usage_daily FOR SELECT USING (
  EXISTS (SELECT 1 FROM api_keys WHERE id = api_usage_daily.api_key_id AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);
```

---

## 9. Step 7: Cron Jobs (pg_cron)

After enabling `pg_cron` and `pg_net` extensions, run this in the SQL Editor.

**IMPORTANT**: Replace `YOUR_PROJECT_REF` and `YOUR_ANON_KEY` with your actual values.

```sql
-- RSS Ingestion every 15 minutes
SELECT cron.schedule(
  'ingest-rss-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-rss',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- Daily Digest at 7:00 AM IST (1:30 AM UTC)
SELECT cron.schedule(
  'daily-digest-7am-ist',
  '30 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
```

---

## 10. Step 8: Edge Functions

All edge functions are in `supabase/functions/`. Deploy them using the Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy ingest-rss --no-verify-jwt
supabase functions deploy get-stories --no-verify-jwt
supabase functions deploy send-daily-digest --no-verify-jwt
supabase functions deploy text-to-speech --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy send-otp --no-verify-jwt
supabase functions deploy verify-otp --no-verify-jwt
supabase functions deploy update-password --no-verify-jwt
supabase functions deploy translate-to-english --no-verify-jwt
supabase functions deploy custom-email-hook --no-verify-jwt
supabase functions deploy places-search --no-verify-jwt
supabase functions deploy places-details --no-verify-jwt
supabase functions deploy places-weather --no-verify-jwt
supabase functions deploy places-nearby --no-verify-jwt
supabase functions deploy places-news --no-verify-jwt
supabase functions deploy places-aqi --no-verify-jwt
supabase functions deploy places-airports --no-verify-jwt
supabase functions deploy places-ai-summary --no-verify-jwt
supabase functions deploy places-ask --no-verify-jwt
supabase functions deploy api-health --no-verify-jwt
supabase functions deploy api-v1-news --no-verify-jwt
supabase functions deploy api-v1-places --no-verify-jwt
supabase functions deploy api-v1-world --no-verify-jwt
supabase functions deploy create-api-subscription --no-verify-jwt
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
supabase functions deploy verify-api-subscription --no-verify-jwt
supabase functions deploy validate-api-key --no-verify-jwt
supabase functions deploy track-api-usage --no-verify-jwt
supabase functions deploy deliver-webhook --no-verify-jwt
supabase functions deploy send-breaking-news-alert --no-verify-jwt
supabase functions deploy send-push-notifications --no-verify-jwt
supabase functions deploy unsubscribe-newsletter --no-verify-jwt
```

### Edge Function Summary

| Function | Purpose |
|----------|---------|
| `ingest-rss` | Core RSS ingestion pipeline — fetches, normalizes, dedupes, classifies, stores stories |
| `get-stories` | Main news API — serves stories with filtering, pagination, clustering |
| `send-daily-digest` | Sends daily email digest via Resend at 7 AM IST |
| `text-to-speech` | Converts news text to audio using ElevenLabs/Sarvam |
| `translate-to-english` | Translates regional language headlines to English |
| `send-email` | Generic email sending via Resend |
| `send-otp` / `verify-otp` | Email OTP for ingestion access verification |
| `update-password` | Password update for newsroom members |
| `places-*` | Google Places API integration for location features |
| `api-v1-*` | Public API endpoints for enterprise customers |
| `validate-api-key` | API key validation with rate limiting |
| `create-razorpay-order` / `verify-razorpay-payment` | Razorpay payment integration |
| `deliver-webhook` | Webhook delivery to enterprise subscribers |
| `send-push-notifications` | Web Push notification delivery |
| `send-breaking-news-alert` | Breaking news email alerts |

---

## 11. Step 9: Secrets / Environment Variables

Set these as Supabase secrets via CLI or Dashboard:

```bash
# Set secrets via CLI
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
supabase secrets set SARVAM_API_KEY=your_sarvam_key
supabase secrets set GOOGLE_PLACES_API_KEY=your_google_places_key
supabase secrets set OPENWEATHERMAP_API_KEY=your_openweather_key
supabase secrets set OPENAQ_API_KEY=your_openaq_key
supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set GNEWS_API_KEY=your_gnews_key
supabase secrets set SERPAPI_KEY=your_serpapi_key
supabase secrets set NEWSAPI_AI_KEY=your_newsapi_key
supabase secrets set AVIATIONSTACK_API_KEY=your_aviationstack_key
supabase secrets set BOOKING_RAPIDAPI_KEY=your_booking_rapidapi_key
```

### Where to Get API Keys

| Secret | Service | URL |
|--------|---------|-----|
| `RESEND_API_KEY` | Email sending | https://resend.com |
| `ELEVENLABS_API_KEY` | Text-to-speech | https://elevenlabs.io |
| `SARVAM_API_KEY` | Indian language TTS | https://sarvam.ai |
| `GOOGLE_PLACES_API_KEY` | Places, Maps | https://console.cloud.google.com |
| `OPENWEATHERMAP_API_KEY` | Weather data | https://openweathermap.org/api |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments (India) | https://razorpay.com |
| `GNEWS_API_KEY` | News API fallback | https://gnews.io |
| `SERPAPI_KEY` | Search API | https://serpapi.com |

**Note**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-configured.

---

## 12. Step 10: RSS Feed Sources (Complete List)

The platform ingests from **580+ RSS feeds** across **57 countries**.

### Feed Distribution by Country

| Country | Code | Feed Count |
|---------|------|-----------|
| India | IN | 195 |
| United States | US | 85 |
| United Kingdom | GB | 45 |
| Germany | DE | 16 |
| France | FR | 14 |
| Australia | AU | 13 |
| Brazil | BR | 9 |
| South Africa | ZA | 9 |
| Argentina | AR | 8 |
| China | CN | 8 |
| Japan | JP | 8 |
| Spain | ES | 7 |
| Italy | IT | 7 |
| Singapore | SG | 7 |
| Thailand | TH | 7 |
| Vietnam | VN | 7 |
| UAE | AE | 6 |
| Malaysia | MY | 6 |
| New Zealand | NZ | 6 |
| South Korea | KR | 5 |
| Nigeria | NG | 5 |
| Qatar | QA | 5 |
| Saudi Arabia | SA | 5 |
| + 34 more countries | — | 1-4 each |

### India — State-Level Feeds (195 feeds)

The India feeds cover all major states with regional language sources:

| State | state_id | Languages | Key Sources |
|-------|----------|-----------|-------------|
| Andhra Pradesh | andhra-pradesh | Telugu, English | Eenadu, Sakshi, Andhra Jyothi, TOI Hyderabad |
| Assam | assam | Assamese, Bengali | Asomiya Pratidin, Niyomiya Barta, Dainik Janambhumi |
| Bihar | bihar | Hindi | Dainik Bhaskar Bihar, Hindustan Bihar, Prabhat Khabar |
| Chhattisgarh | chhattisgarh | Hindi | Dainik Bhaskar Chhattisgarh |
| Delhi | delhi | Hindi, English | Amar Ujala Delhi, Dainik Bhaskar Delhi, TOI Delhi, Hindustan Delhi |
| Goa | goa | English | TOI Goa |
| Gujarat | gujarat | Gujarati, English | ABP Asmita, TOI Ahmedabad, Divya Bhaskar, Gujarat Samachar |
| Haryana | haryana | Hindi | Amar Ujala Haryana, Dainik Bhaskar Haryana, Dainik Jagran Haryana |
| Himachal Pradesh | himachal-pradesh | Hindi | Amar Ujala Himachal, Dainik Bhaskar Himachal |
| Jharkhand | jharkhand | Hindi | Dainik Bhaskar Jharkhand, Hindustan Jharkhand |
| Karnataka | karnataka | Kannada, English | Prajavani, Vijaya Karnataka, TOI Bengaluru, Deccan Herald |
| Kerala | kerala | Malayalam, English | Manorama Online, Mathrubhumi, TOI Kochi |
| Madhya Pradesh | madhya-pradesh | Hindi | Dainik Bhaskar MP, Nai Dunia |
| Maharashtra | maharashtra | Marathi, English | Loksatta, Maharashtra Times, Sakal, TOI Mumbai |
| Odisha | odisha | Odia, English | Dharitri, Sambad, Pragativadi, TOI Bhubaneswar |
| Punjab | punjab | Punjabi, Hindi | Ajit Punjabi, Jagbani, TOI Chandigarh |
| Rajasthan | rajasthan | Hindi | Dainik Bhaskar Rajasthan, Rajasthan Patrika |
| Tamil Nadu | tamil-nadu | Tamil, English | Dinamalar, Dinamani, The Hindu Tamil, TOI Chennai |
| Telangana | telangana | Telugu, English | Eenadu Telangana, Sakshi Telangana, TOI Hyderabad |
| Uttar Pradesh | uttar-pradesh | Hindi | Amar Ujala UP, Dainik Bhaskar UP, Dainik Jagran UP |
| Uttarakhand | uttarakhand | Hindi | Amar Ujala Uttarakhand, Dainik Jagran Uttarakhand |
| West Bengal | west-bengal | Bengali, English | Anandabazar Patrika, ABP Ananda, Sangbad Pratidin |

### Global — National-Level Sources (Key examples)

| Country | Key Sources |
|---------|-------------|
| US | Reuters, AP News, CNN, NYT, Washington Post, NPR, Fox News, NBC, CBS, ABC, Bloomberg, TechCrunch, The Verge, Politico |
| UK | BBC, The Guardian, Sky News, Financial Times, The Telegraph, The Independent, Daily Mail |
| Germany | DW News, Der Spiegel, Tagesschau |
| France | France 24, Le Monde, RFI |
| Australia | ABC Australia, SBS News, 9News, Sydney Morning Herald |
| Japan | Japan Times, NHK, Nikkei Asia |
| China | South China Morning Post, CGTN, Caixin |
| Middle East | Al Jazeera, Gulf News, Khaleej Times, The National |
| Africa | Daily Maverick (ZA), Premium Times (NG), Daily Nation (KE) |

### RSS Feed Table Schema Reference

Each feed is stored in `rss_feeds` with:
- `name` — Display name (e.g., "Times of India Delhi")
- `url` — RSS feed URL
- `category` — Topic category (general, politics, sports, business, etc.)
- `country_code` — ISO country code (IN, US, GB, etc.)
- `state_id` — Slugified state ID for Indian states (e.g., "odisha", "west-bengal")
- `language` — ISO language code (en, hi, or, ta, te, kn, ml, bn, mr, gu, pa, as)
- `source_type` — "primary" (original reporting) or "secondary" (aggregator/wire)
- `reliability_tier` — "tier_1" (most reliable), "tier_2", "tier_3"
- `priority` — Fetch priority (1-100, higher = more important)
- `is_active` — Whether to fetch this feed

### To Export All Feeds as SQL

Run this in Supabase SQL Editor to get INSERT statements:

```sql
SELECT 'INSERT INTO rss_feeds (name, url, category, country_code, state_id, language, source_type, reliability_tier, is_active) VALUES (' ||
  quote_literal(name) || ', ' ||
  quote_literal(url) || ', ' ||
  quote_literal(COALESCE(category, 'general')) || ', ' ||
  quote_literal(COALESCE(country_code, '')) || ', ' ||
  COALESCE(quote_literal(state_id), 'NULL') || ', ' ||
  quote_literal(COALESCE(language, 'en')) || ', ' ||
  quote_literal(COALESCE(source_type, 'secondary')) || ', ' ||
  quote_literal(COALESCE(reliability_tier, 'tier_2')) || ', ' ||
  'true);'
FROM rss_feeds WHERE is_active = true ORDER BY country_code, state_id, name;
```

---

## 13. Step 11: Frontend Configuration

### Update `.env`

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

### Update `supabase/config.toml`

```toml
project_id = "YOUR_PROJECT_REF"

[functions.ingest-rss]
verify_jwt = false

[functions.get-stories]
verify_jwt = false

[functions.text-to-speech]
verify_jwt = false

[functions.send-daily-digest]
verify_jwt = false

# ... (add all functions with verify_jwt = false)
```

### Key Files to Update

| File | What to Change |
|------|---------------|
| `.env` | Supabase URL, keys |
| `supabase/config.toml` | Project ID |
| `src/integrations/supabase/client.ts` | Auto-generated, just ensure env vars match |
| `public/manifest.json` | App name, icons if rebranding |
| `public/sw.js` | Service worker config |

---

## 14. Step 12: Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
```

The existing `vercel.json` handles SPA routing.

### Alternative: Netlify

The `public/_redirects` file is already configured for Netlify SPA routing.

---

## 15. Troubleshooting

### RSS Ingestion Not Working
1. Check `pg_cron` extension is enabled
2. Verify the cron job exists: `SELECT * FROM cron.job;`
3. Check edge function logs: `supabase functions logs ingest-rss`
4. Verify secrets are set: `supabase secrets list`

### No Stories Showing
1. Check `stories` table has data: `SELECT count(*) FROM stories;`
2. Check `get-stories` function logs
3. Verify the frontend `.env` has correct Supabase URL

### Email Digest Not Sending
1. Verify `RESEND_API_KEY` is set
2. Check `newsletter_subscribers` table has active subscribers
3. Check cron job logs: `SELECT * FROM cron_job_logs WHERE job_name = 'daily-digest' ORDER BY created_at DESC LIMIT 5;`

### Auth Issues
1. Ensure the `handle_new_user` trigger exists on `auth.users`
2. Check Supabase Auth settings (email confirmation, etc.)

---

## Quick Reference: Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| State | TanStack React Query |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Edge Runtime | Deno |
| Email | Resend |
| Payments | Razorpay |
| TTS | ElevenLabs + Sarvam AI |
| Places | Google Places API |
| Weather | OpenWeatherMap |

---

**© 2026 NEWSTACK by ORIGINX LABS. All Rights Reserved.**
