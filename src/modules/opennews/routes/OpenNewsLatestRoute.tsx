import { OpenNewsPostComposer } from "@/modules/opennews/components/OpenNewsPostComposer";
import { OpenNewsFeed } from "@/modules/opennews/components/OpenNewsFeed";
import { OpenNewsTrendingPanel } from "@/modules/opennews/components/OpenNewsTrendingPanel";
import { useSearchParams } from "react-router-dom";

export function OpenNewsLatestRoute() {
  const [params] = useSearchParams();
  const quotePostId = params.get("quote") || undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        <OpenNewsPostComposer defaultQuotePostId={quotePostId} />
        <OpenNewsFeed scope="latest" />
      </div>
      <OpenNewsTrendingPanel />
    </div>
  );
}
