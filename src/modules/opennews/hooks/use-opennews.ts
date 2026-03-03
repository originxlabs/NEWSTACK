import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addBannedTerm,
  createOpenNewsPost,
  createOpenNewsReply,
  deleteBannedTerm,
  fetchBannedTerms,
  fetchModerationQueue,
  fetchOpenNewsMe,
  fetchOpenNewsPoliticians,
  fetchOpenNewsPosts,
  fetchOpenNewsThread,
  fetchOpenNewsTrending,
  fetchTrendingConfig,
  fetchVerificationRequests,
  moderateQueueDecision,
  reviewVerificationRequest,
  submitVerificationRequest,
  updateTrendingConfig,
} from "@/modules/opennews/api/client";

export function useOpenNewsPosts(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ["opennews-posts", params],
    queryFn: () => fetchOpenNewsPosts(params),
    staleTime: 30 * 1000,
  });
}

export function useOpenNewsMe() {
  return useQuery({
    queryKey: ["opennews-me"],
    queryFn: fetchOpenNewsMe,
    staleTime: 30 * 1000,
  });
}

export function useOpenNewsThread(postId: string) {
  return useQuery({
    queryKey: ["opennews-thread", postId],
    queryFn: () => fetchOpenNewsThread(postId),
    enabled: !!postId,
    staleTime: 15 * 1000,
  });
}

export function useOpenNewsTrending(window: "1h" | "6h" | "24h" = "24h") {
  return useQuery({
    queryKey: ["opennews-trending", window],
    queryFn: () => fetchOpenNewsTrending(window),
    staleTime: 60 * 1000,
  });
}

export function useOpenNewsPoliticians(search = "") {
  return useQuery({
    queryKey: ["opennews-politicians", search],
    queryFn: () => fetchOpenNewsPoliticians(search),
    staleTime: 60 * 1000,
  });
}

export function useCreateOpenNewsPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOpenNewsPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opennews-posts"] });
      qc.invalidateQueries({ queryKey: ["opennews-trending"] });
    },
  });
}

export function useCreateOpenNewsReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: string; payload: any }) => createOpenNewsReply(postId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["opennews-thread", vars.postId] });
      qc.invalidateQueries({ queryKey: ["opennews-posts"] });
    },
  });
}

export function useModerationQueue() {
  return useQuery({
    queryKey: ["opennews-moderation-queue"],
    queryFn: fetchModerationQueue,
    staleTime: 15 * 1000,
  });
}

export function useModerationDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ queueId, decision, reason }: { queueId: string; decision: "approve" | "reject" | "hide" | "unhide"; reason?: string }) =>
      moderateQueueDecision(queueId, decision, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opennews-moderation-queue"] });
      qc.invalidateQueries({ queryKey: ["opennews-posts"] });
    },
  });
}

export function useBannedTerms() {
  return useQuery({
    queryKey: ["opennews-banned-terms"],
    queryFn: fetchBannedTerms,
    staleTime: 20 * 1000,
  });
}

export function useAddBannedTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addBannedTerm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opennews-banned-terms"] }),
  });
}

export function useDeleteBannedTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBannedTerm,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opennews-banned-terms"] }),
  });
}

export function useTrendingConfig() {
  return useQuery({
    queryKey: ["opennews-trending-config"],
    queryFn: fetchTrendingConfig,
    staleTime: 20 * 1000,
  });
}

export function useUpdateTrendingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTrendingConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opennews-trending-config"] }),
  });
}

export function useSubmitVerificationRequest() {
  return useMutation({
    mutationFn: submitVerificationRequest,
  });
}

export function useVerificationRequests() {
  return useQuery({
    queryKey: ["opennews-verification-requests"],
    queryFn: fetchVerificationRequests,
    staleTime: 20 * 1000,
  });
}

export function useReviewVerificationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, decision }: { requestId: string; decision: "approve" | "reject" }) =>
      reviewVerificationRequest(requestId, decision),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opennews-verification-requests"] }),
  });
}
