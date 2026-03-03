import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpenNewsPosts } from "@/modules/opennews/hooks/use-opennews";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function statusTone(status: string) {
  if (status === "clean" || status === "approved_override") return "bg-emerald-500/10 text-emerald-600";
  if (status === "watch") return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

export function OpenNewsFeed({ scope = "latest" }: { scope?: string }) {
  const { data, isLoading } = useOpenNewsPosts(scope ? { scope } : {});

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((k) => (
          <Skeleton key={k} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const posts = data?.posts || [];

  if (!posts.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No OpenNews posts yet for this section.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article key={post.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{post.author_role}</Badge>
            <Badge className={statusTone(post.moderation_status)}>{post.moderation_status}</Badge>
            {!!post.controversy_score && (
              <Badge variant="secondary">Controversy {post.controversy_score.toFixed(2)}</Badge>
            )}
          </div>
          {post.headline && <h3 className="font-semibold mb-1">{post.headline}</h3>}
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{post.body}</p>
          {post.tldr && <p className="mt-3 text-xs text-muted-foreground">TLDR: {post.tldr}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Likes {post.metrics?.likes ?? 0}</span>
            <span>Reposts {post.metrics?.reposts ?? 0}</span>
            <span>Comments {post.metrics?.replies ?? 0}</span>
            <span>Bookmarks {post.metrics?.bookmarks ?? 0}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to={`/opennews/thread/${post.id}`}>View thread</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to={`/opennews/latest?quote=${post.id}`}>Quote post</Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
