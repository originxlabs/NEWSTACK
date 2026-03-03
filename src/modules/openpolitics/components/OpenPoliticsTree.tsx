import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenPoliticsNode } from "@/modules/openpolitics/types";

interface OpenPoliticsTreeProps {
  roots: OpenPoliticsNode[];
  selectedSlug: string | null;
  onSelect: (node: OpenPoliticsNode) => void;
}

function NodeRow({
  node,
  selectedSlug,
  onSelect,
  isRoot = false,
}: {
  node: OpenPoliticsNode;
  selectedSlug: string | null;
  onSelect: (node: OpenPoliticsNode) => void;
  isRoot?: boolean;
}) {
  const isSelected = selectedSlug === node.slug;

  return (
    <li className={cn("relative", !isRoot && "pl-8")}>
      {!isRoot && <span className="absolute left-3 top-6 h-px w-4 bg-border/70" />}

      <button
        type="button"
        className={cn(
          "op-tree-node group w-full rounded-xl border p-3 text-left transition-all",
          "hover:border-primary/40 hover:bg-primary/5",
          isSelected ? "border-primary/60 bg-primary/10" : "border-border/60 bg-card",
        )}
        onClick={() => onSelect(node)}
      >
        <div className="flex items-start gap-3">
          <img
            src={node.official_photo_url || "/placeholder.svg"}
            alt={node.name}
            className="h-12 w-12 rounded-lg object-cover border border-border/50"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{node.name}</p>
            <p className="text-xs text-muted-foreground truncate">{node.current_position || "Public office holder"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
              {node.party_name && <span className="rounded-full border border-border/60 px-2 py-0.5">{node.party_name}</span>}
              <span className="rounded-full border border-border/60 px-2 py-0.5">{node.country_code}</span>
              {node.state_code && <span className="rounded-full border border-border/60 px-2 py-0.5">{node.state_code}</span>}
              {node.is_major_leader && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                  <BadgeCheck className="h-3 w-3" />
                  Major
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>

      {node.children.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-border/60 ml-3 pl-3">
          {node.children.map((child) => (
            <NodeRow key={child.id} node={child} selectedSlug={selectedSlug} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OpenPoliticsTree({ roots, selectedSlug, onSelect }: OpenPoliticsTreeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".op-tree-node",
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.04, ease: "power2.out" },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [roots]);

  return (
    <div ref={containerRef} className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
      <h2 className="font-display text-xl font-semibold mb-1">Leader Tree</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Arrow-linked hierarchy of major leaders, ministers, and role chains from public records.
      </p>

      {!roots.length ? (
        <p className="text-sm text-muted-foreground">No hierarchy available yet. Run the politics sync job.</p>
      ) : (
        <ul className="space-y-4 max-h-[70vh] overflow-auto pr-1">
          {roots.map((root) => (
            <NodeRow
              key={root.id}
              node={root}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              isRoot
            />
          ))}
        </ul>
      )}
    </div>
  );
}
