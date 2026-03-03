# OpenNews Social Bridge

Supabase Edge Function: `opennews-social`

This function supports official X API operations for OpenNews:

- `search_x_news`: fetch recent X posts for a query (monitoring/signals).
- `post_to_x`: publish a post to X from OpenNews workflows.

## Required Supabase function secrets

- `X_BEARER_TOKEN`: app-level bearer for `search_x_news`.
- `X_USER_ACCESS_TOKEN`: user-scoped OAuth2 token with `tweet.write` scope for `post_to_x`.
- `X_API_BASE` (optional): defaults to `https://api.x.com/2`.

## Deploy

```bash
supabase functions deploy opennews-social --project-ref cpdxgnrpboreraiwcqgl --no-verify-jwt
```

## Search X news

```bash
curl -sS "$VITE_SUPABASE_URL/functions/v1/opennews-social" \
  -H "Content-Type: application/json" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -d '{
    "action": "search_x_news",
    "query": "(breaking OR latest) (india OR world) -is:retweet lang:en",
    "max_results": 25
  }'
```

## Post to X

```bash
curl -sS "$VITE_SUPABASE_URL/functions/v1/opennews-social" \
  -H "Content-Type: application/json" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -d '{
    "action": "post_to_x",
    "text": "OpenNews: Verified update from trusted media sources."
  }'
```

## Notes

- Use official APIs only. Avoid non-compliant scraping.
- Rate limits depend on your X developer plan.
