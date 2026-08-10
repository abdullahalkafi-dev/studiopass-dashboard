import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const crmApi = createApi({
  reducerPath: "crmApi",
  baseQuery,
  tagTypes: ["Listener"],
  endpoints: (builder) => ({
    getListeners: builder.query({
      query: (params?: { page?: number; limit?: number; isActive?: string; search?: string; country?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.isActive) searchParams.set("isActive", params.isActive);
        if (params?.search) searchParams.set("search", params.search);
        if (params?.country) searchParams.set("country", params.country);
        return `/user/listeners?${searchParams.toString()}`;
      },
      providesTags: ["Listener"],
    }),
    getListenerById: builder.query({
      query: (id: string) => `/user/listeners/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Listener", id }],
    }),
    getListenerVotes: builder.query({
      query: (id: string) => `/user/listeners/${id}/votes`,
      providesTags: (_result, _error, id) => [{ type: "Listener", id }],
    }),
  }),
});

export const { useGetListenersQuery, useGetListenerByIdQuery, useGetListenerVotesQuery } = crmApi;
