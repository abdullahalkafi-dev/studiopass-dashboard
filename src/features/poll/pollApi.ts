import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const pollApi = createApi({
  reducerPath: "pollApi",
  baseQuery,
  tagTypes: ["Poll"],
  endpoints: (builder) => ({
    getPolls: builder.query({
      query: ({ page = 1, limit = 20, station, status, search }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (station) params.set("station", station);
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        return `/poll?${params.toString()}`;
      },
      providesTags: ["Poll"],
    }),

    getPollById: builder.query({
      query: (id) => `/poll/${id}`,
      providesTags: ["Poll"],
    }),

    createPoll: builder.mutation({
      query: ({ stationId, question, options, showId, expiresAt }) => ({
        url: "/poll",
        method: "POST",
        body: { stationId, question, options, showId, expiresAt },
      }),
      invalidatesTags: ["Poll"],
    }),

    updatePoll: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/poll/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Poll"],
    }),

    deletePoll: builder.mutation({
      query: (id) => ({
        url: `/poll/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Poll"],
    }),
  }),
});

export const {
  useGetPollsQuery,
  useGetPollByIdQuery,
  useCreatePollMutation,
  useUpdatePollMutation,
  useDeletePollMutation,
} = pollApi;
