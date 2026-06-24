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
  }),
});

export const { useGetListenersQuery, useGetListenerByIdQuery } = crmApi;
