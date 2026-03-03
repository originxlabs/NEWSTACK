import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useOpenNewsPoliticians } from "@/modules/opennews/hooks/use-opennews";

export function OpenNewsPoliticianSearch() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useOpenNewsPoliticians(q);

  return (
    <section className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <h3 className="font-semibold">Political Transparency Tracker</h3>
      <Input
        placeholder="Search politicians, party, country, state..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Searching...</p>
      ) : !(data && data.length) ? (
        <p className="text-sm text-muted-foreground">No politicians found.</p>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-lg border border-border/50 p-3 text-sm">
              <p className="font-medium">{item.name}</p>
              <p className="text-muted-foreground">
                {item.country_code}{item.state_code ? ` · ${item.state_code}` : ""}
                {item.party_name ? ` · ${item.party_name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Credibility {item.credibility_score} · Controversies {item.controversy_count}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
