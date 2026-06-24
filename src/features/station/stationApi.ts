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

export const stationApi = createApi({
  reducerPath: "stationApi",
  baseQuery,
  tagTypes: ["Station"],
  endpoints: (builder) => ({
    getStations: builder.query({
      query: (params?: { page?: number; limit?: number; category?: string; country?: string; partner?: string; isActive?: string; search?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.category) searchParams.set("category", params.category);
        if (params?.country) searchParams.set("country", params.country);
        if (params?.partner) searchParams.set("partner", params.partner);
        if (params?.isActive) searchParams.set("isActive", params.isActive);
        if (params?.search) searchParams.set("search", params.search);
        return `/station?${searchParams.toString()}`;
      },
      providesTags: ["Station"],
    }),
    getStationById: builder.query({
      query: (id: string) => `/station/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Station", id }],
    }),
    createStation: builder.mutation({
      query: (body: {
        name: string;
        stationCode: string;
        category: string;
        countryId: string;
        partnerId: string;
        description?: string;
        website?: string;
        adminFullName: string;
        adminUsername: string;
        adminPassword: string;
      }) => ({
        url: "/station",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Station"],
    }),
    uploadStationLogo: builder.mutation({
      query: ({ id, file }: { id: string; file: File }) => {
        const formData = new FormData();
        formData.append("logo", file);
        return {
          url: `/station/${id}/logo`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["Station"],
    }),
    uploadStationCoverImage: builder.mutation({
      query: ({ id, file }: { id: string; file: File }) => {
        const formData = new FormData();
        formData.append("coverImage", file);
        return {
          url: `/station/${id}/cover-image`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["Station"],
    }),
    updateStation: builder.mutation({
      query: ({ id, ...body }: { id: string; name?: string; description?: string; website?: string; logo?: string; isActive?: boolean }) => ({
        url: `/station/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Station"],
    }),
    deactivateStation: builder.mutation({
      query: (id: string) => ({
        url: `/station/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Station"],
    }),
    reactivateStation: builder.mutation({
      query: (id: string) => ({
        url: `/station/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Station"],
    }),
  }),
});

export const {
  useGetStationsQuery,
  useGetStationByIdQuery,
  useCreateStationMutation,
  useUploadStationLogoMutation,
  useUploadStationCoverImageMutation,
  useUpdateStationMutation,
  useDeactivateStationMutation,
  useReactivateStationMutation,
} = stationApi;
