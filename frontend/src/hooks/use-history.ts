import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { AnalysisSummary } from "@/types";

export interface HistoryListItem {
  _id: string;
  contractType: string;
  summary?: AnalysisSummary;
  createdAt: string;
}

interface HistoryListResponse {
  items: HistoryListItem[];
  total: number;
  page: number;
  limit: number;
}

export function useHistoryList(page = 1) {
  return useQuery<HistoryListResponse, ApiError>({
    queryKey: ["history", page],
    queryFn: () => api.get<HistoryListResponse>(`/history?page=${page}`),
    retry: false,
  });
}

export function useHistoryItem(id: string | null) {
  return useQuery({
    queryKey: ["history", "item", id],
    queryFn: () => api.get(`/history/${id}`),
    enabled: Boolean(id),
    retry: false,
  });
}
