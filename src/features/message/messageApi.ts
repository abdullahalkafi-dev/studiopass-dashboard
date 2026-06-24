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
  tagTypes: ["Message", "Thread"],
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
  }),
});

export const { useGetThreadsQuery, useGetThreadQuery, useSendReplyMutation } =
  messageApi;
