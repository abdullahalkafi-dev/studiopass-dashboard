import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/store";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:5003/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

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
      query: ({ stationId, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        params.set("stationId", stationId);
        params.set("page", String(page));
        params.set("limit", String(limit));
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
        return `/message/export?${params.toString()}`;
      },
    }),

    getMessages: builder.query({
      query: ({ stationId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (stationId) params.set("stationId", stationId);
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/message/list?${params.toString()}`;
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
