import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const channelPollApi = createApi({
  reducerPath: "channelPollApi",
  baseQuery,
  tagTypes: ["ChannelPoll"],
  endpoints: (builder) => ({
    getChannelPolls: builder.query({
      query: (params?: { page?: number; limit?: number; station?: string; status?: string; search?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.station) searchParams.set("station", params.station);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.search) searchParams.set("search", params.search);
        return `/channel-poll?${searchParams.toString()}`;
      },
      providesTags: ["ChannelPoll"],
    }),
    getChannelPollById: builder.query({
      query: (id: string) => `/channel-poll/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ChannelPoll", id }],
    }),
    getStationChannelPolls: builder.query({
      query: ({ stationId, page = 1, limit = 20, status }: { stationId: string; page?: number; limit?: number; status?: string }) => {
        const searchParams = new URLSearchParams();
        searchParams.set("page", String(page));
        searchParams.set("limit", String(limit));
        if (status) searchParams.set("status", status);
        return `/channel-poll?station=${stationId}&${searchParams.toString()}`;
      },
      providesTags: ["ChannelPoll"],
    }),
    getChannelPollResults: builder.query({
      query: (id: string) => `/channel-poll/${id}/results`,
      providesTags: (_result, _error, id) => [{ type: "ChannelPoll", id }],
    }),
    createChannelPoll: builder.mutation({
      query: (body: {
        station?: string;
        title: string;
        description?: string;
        categories: { name: string; nominees: { name: string; photo?: string; description?: string }[] }[];
        billingMode?: string;
        creditCost?: number;
        startDate: string;
        endDate: string;
      }) => ({
        url: "/channel-poll",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChannelPoll"],
    }),
    updateChannelPoll: builder.mutation({
      query: ({ id, ...body }: { id: string; title?: string; status?: string }) => ({
        url: `/channel-poll/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ChannelPoll"],
    }),
    deleteChannelPoll: builder.mutation({
      query: (id: string) => ({
        url: `/channel-poll/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChannelPoll"],
    }),
  }),
});

export const {
  useGetChannelPollsQuery,
  useGetChannelPollByIdQuery,
  useGetStationChannelPollsQuery,
  useGetChannelPollResultsQuery,
  useCreateChannelPollMutation,
  useUpdateChannelPollMutation,
  useDeleteChannelPollMutation,
} = channelPollApi;
