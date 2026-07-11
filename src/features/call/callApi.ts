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

export const callApi = createApi({
  reducerPath: "callApi",
  baseQuery,
  tagTypes: ["Call"],
  endpoints: (builder) => ({
    getStationCalls: builder.query({
      query: ({ stationId, status, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        params.set("stationId", stationId);
        if (status) params.set("status", status);
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/call/station?${params.toString()}`;
      },
      providesTags: ["Call"],
    }),

    acceptCall: builder.mutation({
      query: (callId) => ({
        url: "/call/accept",
        method: "POST",
        body: { callId },
      }),
      invalidatesTags: ["Call"],
    }),

    endCall: builder.mutation({
      query: (callId) => ({
        url: "/call/end",
        method: "POST",
        body: { callId },
      }),
      invalidatesTags: ["Call"],
    }),
  }),
});

export const {
  useGetStationCallsQuery,
  useAcceptCallMutation,
  useEndCallMutation,
} = callApi;
