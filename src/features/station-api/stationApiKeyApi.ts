import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export interface StationApiKey {
  _id: string;
  station: string;
  key?: string; // only returned on creation
  name: string;
  type: "sandbox" | "production";
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  regeneratedAt?: string;
  totalHits: number;
  avgResponseTimeMs: number;
  createdAt: string;
}

export interface StationApiStats {
  totalHits: number;
  avgResponseTimeMs: number;
  successRatio: number;
  hitsToday: number;
  recentStatusCodes: Record<string, number>;
  topKeys: Array<{
    id: string;
    name: string;
    type: string;
    hits: number;
    avgMs: number;
    isActive: boolean;
  }>;
}

export interface StationApiLog {
  id: string;
  endpoint: string;
  queryParams?: Record<string, unknown>;
  responseTimeMs: number;
  statusCode: number;
  ipAddress?: string;
  responseSizeBytes?: number;
  hitAt: string;
  apiKeyId: string;
}

export const stationApiKeyApi = createApi({
  reducerPath: "stationApiKeyApi",
  baseQuery,
  tagTypes: ["StationApiKey", "StationApiStats", "StationApiLog"],
  endpoints: (builder) => ({
    getKeys: builder.query<StationApiKey[], { stationId: string }>({
      query: ({ stationId }) => `/station-api/keys?stationId=${stationId}`,
      transformResponse: (response: any) => response.data,
      providesTags: ["StationApiKey"],
    }),

    createKey: builder.mutation<
      StationApiKey,
      { stationId: string; name: string; type: "sandbox" | "production" }
    >({
      query: (body) => ({
        url: "/station-api/keys",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["StationApiKey"],
    }),

    regenerateKey: builder.mutation<StationApiKey, string>({
      query: (id) => ({
        url: `/station-api/keys/${id}/regenerate`,
        method: "PATCH",
      }),
      transformResponse: (response: any) => response.data,
      invalidatesTags: ["StationApiKey"],
    }),

    deleteKey: builder.mutation<void, string>({
      query: (id) => ({
        url: `/station-api/keys/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StationApiKey"],
    }),

    getStats: builder.query<StationApiStats, { stationId: string }>({
      query: ({ stationId }) => `/station-api/keys/stats?stationId=${stationId}`,
      transformResponse: (response: any) => response.data,
      providesTags: ["StationApiStats"],
    }),

    getLogs: builder.query<
      { logs: StationApiLog[]; meta: { page: number; limit: number; total: number; totalPage: number } },
      { stationId: string; page?: number; limit?: number }
    >({
      query: ({ stationId, page = 1, limit = 20 }) =>
        `/station-api/keys/logs?stationId=${stationId}&page=${page}&limit=${limit}`,
      transformResponse: (response: any) => ({
        logs: response.data,
        meta: response.meta,
      }),
      providesTags: ["StationApiLog"],
    }),

    // External TV API test (uses API key auth, not JWT)
    testApiEndpoint: builder.query<
      any[],
      { apiKey: string; limit?: number; show?: string }
    >({
      query: ({ apiKey, limit = 10, show }) => {
        const params = new URLSearchParams({ apiKey, limit: String(limit) });
        if (show) params.set("show", show);
        return `/station-api/messages?${params.toString()}`;
      },
      transformResponse: (response: any) => response.data,
    }),

    revealKey: builder.mutation<{ key: string }, { id: string; password: string }>({
      query: ({ id, password }) => ({
        url: `/station-api/keys/${id}/reveal`,
        method: "POST",
        body: { password },
      }),
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetKeysQuery,
  useCreateKeyMutation,
  useRegenerateKeyMutation,
  useDeleteKeyMutation,
  useGetStatsQuery,
  useGetLogsQuery,
  useLazyTestApiEndpointQuery,
  useRevealKeyMutation,
} = stationApiKeyApi;
