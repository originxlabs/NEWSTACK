import { ExternalLink, FileWarning, Landmark, Newspaper, Scale, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpenPoliticsProfile } from "@/modules/openpolitics/types";

interface OpenPoliticsProfilePanelProps {
  data: OpenPoliticsProfile | null | undefined;
  isLoading: boolean;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
      Select a leader from the tree to view full profile details.
    </div>
  );
}

export function OpenPoliticsProfilePanel({ data, isLoading }: OpenPoliticsProfilePanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!data) return <EmptyState />;

  const profile = data.politician;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-start gap-4">
          <img
            src={profile.official_photo_url || "/placeholder.svg"}
            alt={profile.name}
            className="h-20 w-20 rounded-xl border border-border/50 object-cover"
          />
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold leading-tight">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.current_position || "Public office"} {profile.party_name ? `· ${profile.party_name}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.country_code} {profile.state_code ? `· ${profile.state_code}` : ""} · Last sync{" "}
              {profile.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : "N/A"}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mt-4">
          {profile.bio || (profile.metadata?.wiki_extract as string) || "No biography captured yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border/60 px-2 py-1">Credibility {profile.credibility_score ?? "-"}</span>
          <span className="rounded-full border border-border/60 px-2 py-1">Controversies {profile.controversy_count ?? 0}</span>
          {profile.government_email && <span className="rounded-full border border-border/60 px-2 py-1">{profile.government_email}</span>}
        </div>

        {profile.wikipedia_url && (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <a href={profile.wikipedia_url} target="_blank" rel="noreferrer noopener">
              Wikipedia
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          Office Timeline
        </h3>
        <div className="space-y-2">
          {data.office_terms.length ? (
            data.office_terms.map((term) => (
              <div key={term.id} className="rounded-lg border border-border/50 p-3 text-sm">
                <p className="font-medium">{term.office_title}</p>
                <p className="text-muted-foreground">
                  {term.region || "National"} · {term.started_on || "Unknown"} to {term.ended_on || "Present"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No office timeline data available.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Public Record Snapshot
        </h3>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground">Education</p>
            <p>{profile.education || "Not captured yet"}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground">Qualifications</p>
            <p>{profile.qualifications || "Not captured yet"}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground">Declared Income</p>
            <p>{profile.declared_income_text || "Not captured yet"}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground">Criminal Cases</p>
            <p>{profile.criminal_case_summary || "No records captured"}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground">Corruption Cases</p>
            <p>{profile.corruption_case_summary || "No records captured"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Controversies
        </h3>
        <div className="space-y-2">
          {data.controversies.length ? (
            data.controversies.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/50 p-3 text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1">{item.description || "No description provided"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Severity {item.severity ?? 0} · {item.happened_on || "Date unknown"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No controversy records available.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          Recent News (Last 12 Months)
        </h3>
        <div className="space-y-2">
          {data.recent_news.length ? (
            data.recent_news.map((news) => (
              <div key={news.id} className="rounded-lg border border-border/50 p-3">
                <p className="font-medium text-sm">{news.headline}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(news.created_at).toLocaleDateString()} {news.country_code ? `· ${news.country_code}` : ""}
                </p>
                {news.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{news.summary}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent linked stories found.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold mb-3 inline-flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-primary" />
          Source Ledger
        </h3>
        <div className="space-y-2">
          {data.sources.length ? (
            data.sources.map((source) => (
              <a
                key={source.id}
                href={source.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-lg border border-border/50 p-3 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <p className="font-medium">{source.source_title || source.source_type}</p>
                <p className="text-xs text-muted-foreground truncate">{source.source_url}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Captured {new Date(source.captured_at).toLocaleString()}
                </p>
              </a>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No source captures yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
