import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OpenNewsPostComposer } from "@/modules/opennews/components/OpenNewsPostComposer";
import { useOpenNewsThread } from "@/modules/opennews/hooks/use-opennews";

function statusTone(status: string) {
  if (status === "clean" || status === "approved_override") return "bg-emerald-500/10 text-emerald-600";
  if (status === "watch") return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

export function OpenNewsThreadRoute() {
  const { postId = "" } = useParams();
  const { data, isLoading, refetch } = useOpenNewsThread(postId);

  const childrenMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of data?.posts || []) {
      const key = p.parent_post_id || "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [data]);

  const root = useMemo(() => {
    if (!data?.posts?.length) return null;
    return data.posts.find((p) => p.id === data.root_id) || data.posts[0];
  }, [data]);

  function renderNode(post: any, depth = 0): JSX.Element {
    const children = childrenMap.get(post.id) || [];
    return (
      <div key={post.id} className="space-y-2" style={{ marginLeft: Math.min(depth * 20, 60) }}>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{post.author_role}</Badge>
            <Badge className={statusTone(post.moderation_status)}>{post.moderation_status}</Badge>
            {!!post.quote_post_id && <Badge variant="secondary">Quote</Badge>}
          </div>
          {post.headline && <h3 className="font-semibold mb-1">{post.headline}</h3>}
          <p className="text-sm whitespace-pre-wrap">{post.body}</p>
          <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-3">
            <span>Likes {post.metrics?.likes ?? 0}</span>
            <span>Replies {post.metrics?.replies ?? 0}</span>
            <span>Controversy {Number(post.controversy_score || 0).toFixed(2)}</span>
          </div>
        </article>

        {children.length > 0 && (
          <div className="space-y-2">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Thread View</h2>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/opennews/latest">Back to feed</Link>
          </Button>
          <Button size="sm" onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : !root ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Thread not found.
        </div>
      ) : (
        <>
          <OpenNewsPostComposer parentPostId={root.id} onPosted={() => refetch()} />
          <div className="space-y-3">{renderNode(root, 0)}</div>
        </>
      )}
    </div>
  );
}
