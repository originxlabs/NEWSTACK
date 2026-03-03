ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_topic_preferences ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_news_interactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Languages are publicly readable" ON public.languages FOR SELECT USING (true);

CREATE POLICY "Countries are publicly readable" ON public.countries FOR SELECT USING (true);

CREATE POLICY "Topics are publicly readable" ON public.topics FOR SELECT USING (true);

CREATE POLICY "News is publicly readable" ON public.news FOR SELECT USING (true);

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their topic preferences" ON public.user_topic_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their topic preferences" ON public.user_topic_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their topic preferences" ON public.user_topic_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their topic preferences" ON public.user_topic_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their interactions" ON public.user_news_interactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create interactions" ON public.user_news_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their interactions" ON public.user_news_interactions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their saved news" ON public.saved_news FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save news" ON public.saved_news FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave news" ON public.saved_news FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved places"
ON public.saved_places FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save places"
ON public.saved_places FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved places"
ON public.saved_places FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved places"
ON public.saved_places FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-hidden discussions"
ON public.discussions FOR SELECT
USING (is_hidden = false);

CREATE POLICY "Anyone can create discussions"
ON public.discussions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own discussions"
ON public.discussions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reactions"
ON public.discussion_reactions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create reactions"
ON public.discussion_reactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
ON public.discussion_reactions FOR DELETE
USING (auth.uid() = user_id OR anonymous_id IS NOT NULL);

CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create donations"
ON public.donations FOR INSERT
WITH CHECK (true);

ALTER TABLE public.cached_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached news" 
ON public.cached_news 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage cached news" 
ON public.cached_news 
FOR ALL 
USING (true);

ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read breaking news" 
ON public.breaking_news 
FOR SELECT 
USING (is_active = true AND expires_at > now());

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.story_sources ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are publicly readable" ON public.stories FOR SELECT USING (true);

CREATE POLICY "Story sources are publicly readable" ON public.story_sources FOR SELECT USING (true);

CREATE POLICY "RSS feeds are publicly readable" ON public.rss_feeds FOR SELECT USING (true);

ALTER TABLE public.newsletter_popup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create popup events" 
  ON public.newsletter_popup_events FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can read popup events" 
  ON public.newsletter_popup_events FOR SELECT 
  USING (true);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin list" 
  ON public.admin_users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

ALTER TABLE public.rss_ingestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ingestion logs" 
  ON public.rss_ingestion_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert ingestion logs" 
  ON public.rss_ingestion_logs FOR INSERT 
  WITH CHECK (true);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views" 
  ON public.page_views FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view page views" 
  ON public.page_views FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert click events" 
  ON public.click_events FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view click events" 
  ON public.click_events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cron logs" 
  ON public.cron_job_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "System can insert cron logs" 
  ON public.cron_job_logs FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can insert RSS feeds" 
  ON public.rss_feeds FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can update RSS feeds" 
  ON public.rss_feeds FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can delete RSS feeds" 
  ON public.rss_feeds FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au 
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Anyone can read RSS feeds" 
  ON public.rss_feeds FOR SELECT 
  USING (true);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert push subscriptions" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view their subscriptions" 
  ON public.push_subscriptions FOR SELECT 
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their subscriptions" 
  ON public.push_subscriptions FOR UPDATE 
  USING (user_id = auth.uid() OR user_id IS NULL);

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ingestion runs" 
ON public.ingestion_runs 
FOR SELECT 
TO authenticated
USING (true);

ALTER TABLE public.newsroom_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and superadmins can view all members"
ON public.newsroom_members FOR SELECT
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owners can insert members"
ON public.newsroom_members FOR INSERT
TO authenticated
WITH CHECK (public.get_newsroom_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can update members"
ON public.newsroom_members FOR UPDATE
TO authenticated
USING (public.get_newsroom_role(auth.uid()) = 'owner');

CREATE POLICY "Owners can delete members"
ON public.newsroom_members FOR DELETE
TO authenticated
USING (public.get_newsroom_role(auth.uid()) = 'owner');

ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feeds"
ON public.rss_feeds FOR SELECT
USING (true);

CREATE POLICY "Owners and superadmins can insert feeds"
ON public.rss_feeds FOR INSERT
TO authenticated
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owners and superadmins can update feeds"
ON public.rss_feeds FOR UPDATE
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owners and superadmins can delete feeds"
ON public.rss_feeds FOR DELETE
TO authenticated
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.api_key_usage_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner and superadmin can view API keys"
ON public.api_keys FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can create API keys"
ON public.api_keys FOR INSERT
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can update API keys"
ON public.api_keys FOR UPDATE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can delete API keys"
ON public.api_keys FOR DELETE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can view usage logs"
ON public.api_key_usage_logs FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can view webhook subscriptions"
ON public.webhook_subscriptions FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can create webhook subscriptions"
ON public.webhook_subscriptions FOR INSERT
WITH CHECK (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can update webhook subscriptions"
ON public.webhook_subscriptions FOR UPDATE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can delete webhook subscriptions"
ON public.webhook_subscriptions FOR DELETE
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

CREATE POLICY "Owner and superadmin can view webhook delivery logs"
ON public.webhook_delivery_logs FOR SELECT
USING (public.is_newsroom_owner_or_superadmin(auth.uid()));

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.owner_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only owners can view audit logs"
  ON public.owner_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.newsroom_members
      WHERE newsroom_members.user_id = auth.uid()
      AND newsroom_members.role = 'owner'
      AND newsroom_members.is_active = true
    )
  );

CREATE POLICY "Anyone can insert audit logs"
  ON public.owner_access_logs
  FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.ingestion_user_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Newsroom owners can view ingestion logs"
  ON public.ingestion_user_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.newsroom_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'superadmin')
      AND is_active = true
    )
  );

CREATE POLICY "Service role can insert ingestion logs"
  ON public.ingestion_user_logs
  FOR INSERT
  WITH CHECK (true);

ALTER TABLE public.enterprise_subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.api_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.enterprise_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.enterprise_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.enterprise_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view usage for their API keys"
ON public.api_usage_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE api_keys.id = api_usage_tracking.api_key_id 
    AND api_keys.customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view daily usage for their API keys"
ON public.api_usage_daily FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE api_keys.id = api_usage_daily.api_key_id 
    AND api_keys.customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read ingestion runs"
    ON public.ingestion_runs
    FOR SELECT
    USING (true);

ALTER TABLE public.ingestion_access_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert access users"
  ON public.ingestion_access_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read their own data"
  ON public.ingestion_access_users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own data"
  ON public.ingestion_access_users
  FOR UPDATE
  USING (true);

ALTER TABLE public.feed_fetch_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read feed fetch results"
  ON public.feed_fetch_results
  FOR SELECT
  USING (true);

