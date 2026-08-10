import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const messageApi = createApi({
  reducerPath: "messageApi",
  baseQuery,
  tagTypes: ["Message", "Thread", "Pending"],
  endpoints: (builder) => ({
    getThreads: builder.query({
      query: ({ stationId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (stationId) params.set("stationId", stationId);
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/message/threads?${params.toString()}`;
      },
      providesTags: ["Thread"],
    }),

    getThread: builder.query({
      query: ({ stationId, msisdn, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        params.set("stationId", stationId);
        params.set("msisdn", msisdn);
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/message/thread?${params.toString()}`;
      },
      providesTags: ["Message"],
    }),

    sendReply: builder.mutation({
      query: ({ stationId, msisdn, content, templateUsed }) => ({
        url: "/message/reply",
        method: "POST",
        body: { stationId, msisdn, content, templateUsed },
      }),
      invalidatesTags: ["Message", "Thread"],
    }),

    getPendingMessages: builder.query({
      query: ({ stationId, page = 1, limit = 50, search, type, timeRange }: {
        stationId?: string;
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        timeRange?: string;
      } = {}) => {
        const params = new URLSearchParams();
        if (stationId) params.set("stationId", stationId);
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (type && type !== "all") params.set("type", type);
        if (timeRange && timeRange !== "all") params.set("timeRange", timeRange);
        return `/message/pending?${params.toString()}`;
      },
      providesTags: ["Pending"],
    }),

    approveMessage: builder.mutation({
      query: (id) => ({
        url: `/message/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Pending", "Message", "Thread"],
    }),

    rejectMessage: builder.mutation({
      query: ({ id, rejectionReason }) => ({
        url: `/message/${id}/reject`,
        method: "PATCH",
        body: { rejectionReason },
      }),
      invalidatesTags: ["Pending", "Message", "Thread"],
    }),

    sendToOutput: builder.mutation({
      query: (id) => ({
        url: `/message/${id}/send-to-output`,
        method: "PATCH",
      }),
      invalidatesTags: ["Pending", "Message", "Thread"],
    }),

    getMessageById: builder.query({
      query: (id) => `/message/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Message", id }],
    }),

    searchMessages: builder.query({
      query: ({ q, stationId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (stationId) params.set("stationId", stationId);
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/message/search?${params.toString()}`;
      },
      providesTags: ["Message"],
    }),

    exportMessages: builder.query({
      query: ({ stationId, format = "csv" }) => {
        const params = new URLSearchParams();
        if (stationId) params.set("stationId", stationId);
        params.set("format", format);
        return {
          url: `/message/export?${params.toString()}`,
          responseHandler: (response) => response.text(),
        };
      },
    }),

    getMessages: builder.query({
      query: (params?: {
        stationId?: string;
        country?: string;
        show?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
      }) => {
        const searchParams = new URLSearchParams();
        if (params?.stationId) searchParams.set("stationId", params.stationId);
        if (params?.country) searchParams.set("country", params.country);
        if (params?.show) searchParams.set("show", params.show);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.search) searchParams.set("search", params.search);
        searchParams.set("page", String(params?.page || 1));
        searchParams.set("limit", String(params?.limit || 20));
        return `/message/list?${searchParams.toString()}`;
      },
      providesTags: ["Message"],
    }),
  }),
});

export const {
  useGetThreadsQuery,
  useGetThreadQuery,
  useSendReplyMutation,
  useGetPendingMessagesQuery,
  useApproveMessageMutation,
  useRejectMessageMutation,
  useSendToOutputMutation,
  useGetMessageByIdQuery,
  useSearchMessagesQuery,
  useLazyExportMessagesQuery,
  useGetMessagesQuery,
} = messageApi;
