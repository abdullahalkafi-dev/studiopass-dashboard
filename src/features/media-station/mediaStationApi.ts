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

export const mediaStationApi = createApi({
  reducerPath: "mediaStationApi",
  baseQuery,
  tagTypes: ["MediaStation"],
  endpoints: (builder) => ({
    getMediaStations: builder.query({
      query: (params?: { page?: number; limit?: number; isActive?: string; search?: string; station?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.isActive) searchParams.set("isActive", params.isActive);
        if (params?.search) searchParams.set("search", params.search);
        if (params?.station) searchParams.set("station", params.station);
        return `/user/media-stations?${searchParams.toString()}`;
      },
      providesTags: ["MediaStation"],
    }),
    createMediaStation: builder.mutation({
      query: (body: {
        fullName: string;
        email?: string;
        phone?: string;
        stationId: string;
        username: string;
        password: string;
      }) => ({
        url: "/user/create-media-station",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MediaStation"],
    }),
    deactivateMediaStation: builder.mutation({
      query: (id: string) => ({
        url: `/user/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["MediaStation"],
    }),
    reactivateMediaStation: builder.mutation({
      query: (id: string) => ({
        url: `/user/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["MediaStation"],
    }),
  }),
});

export const {
  useGetMediaStationsQuery,
  useCreateMediaStationMutation,
  useDeactivateMediaStationMutation,
  useReactivateMediaStationMutation,
} = mediaStationApi;
