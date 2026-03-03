import { useQuery } from "@tanstack/react-query";
import { fetchOpenPoliticsProfile, fetchOpenPoliticsTree } from "@/modules/openpolitics/api/client";
import type { OpenPoliticsScope } from "@/modules/openpolitics/types";

export function useOpenPoliticsTree(scope: OpenPoliticsScope) {
  return useQuery({
    queryKey: ["open-politics-tree", scope],
    queryFn: () => fetchOpenPoliticsTree(scope),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOpenPoliticsProfile(slug: string | null) {
  return useQuery({
    queryKey: ["open-politics-profile", slug],
    queryFn: () => fetchOpenPoliticsProfile(slug as string),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}
