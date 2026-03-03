import { OpenNewsFeed } from "@/modules/opennews/components/OpenNewsFeed";
import { OpenNewsPoliticianSearch } from "@/modules/opennews/components/OpenNewsPoliticianSearch";
import { OpenNewsTrendingPanel } from "@/modules/opennews/components/OpenNewsTrendingPanel";
import { OpenNewsVerificationRequestCard } from "@/modules/opennews/components/OpenNewsVerificationRequestCard";

export function OpenNewsInvestigationsRoute() {
  return <OpenNewsFeed scope="investigations" />;
}

export function OpenNewsAnonymousReportsRoute() {
  return <OpenNewsFeed scope="anonymous" />;
}

export function OpenNewsVerifiedJournalistsRoute() {
  return (
    <div className="space-y-4">
      <OpenNewsVerificationRequestCard />
      <OpenNewsFeed scope="verified_journalists" />
    </div>
  );
}

export function OpenNewsDebateArenaRoute() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <OpenNewsFeed scope="debate" />
      <OpenNewsTrendingPanel />
    </div>
  );
}

export function OpenNewsPoliticalTrackerRoute() {
  return (
    <div className="space-y-6">
      <OpenNewsPoliticianSearch />
      <OpenNewsFeed scope="political_tracker" />
    </div>
  );
}
