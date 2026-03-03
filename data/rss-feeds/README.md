# RSS Feed Data Artifacts

Generated feed lists and coverage reports for the OpenNews ingestion system.

## Current reports

- `active-feed-names-20260302.md`: full active feed names (India + global)
- `active-feed-names-india-20260302.md`: India-only active feed names and publishers
- `active-feed-names-india-complete-20260303.csv`: India feed catalog with added full state/UT coverage fallbacks
- `validated-india-complete-20260303.tsv`: sync-ready India dataset with `state_id` for all mapped feeds
- `active-feed-names-global-20260302.md`: global feed names and publishers
- `active-feeds-india-state-wise-20260302.md`: India state/UT grouped feeds (active snapshot)
- `active-feeds-india-state-wise-20260303.md`: India state/UT grouped feeds (complete catalog view)
- `active-feeds-publisher-wise-20260302.md`: publisher grouped active feed list
- `active-feeds-publisher-wise-20260303.md`: publisher grouped complete catalog list
- `india-rss-coverage-audit-20260302.md`: active snapshot audit (existing live feed state)
- `india-rss-coverage-audit-20260303.md`: complete catalog audit (all 36 India states/UT covered)
- `current-feed-health-20260302.md`: latest health check summary

## Useful scripts

- `scripts/split-feed-lists.sh`
- `scripts/generate-state-publisher-feed-reports.sh`
- `scripts/audit-india-rss-coverage.sh`
- `scripts/sync-rss-feeds.sh`
- `scripts/deactivate-unhealthy-feeds.sh`
