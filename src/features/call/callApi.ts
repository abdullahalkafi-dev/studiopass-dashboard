import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

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
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }: { _id: string }) => ({ type: "Call" as const, id: _id })),
              { type: "Call" as const, id: "LIST" },
              "Call" as const,
            ]
          : [{ type: "Call" as const, id: "LIST" }, "Call" as const],
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

    rejectCall: builder.mutation({
      query: (callId) => ({
        url: "/call/reject",
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
  useRejectCallMutation,
} = callApi;
