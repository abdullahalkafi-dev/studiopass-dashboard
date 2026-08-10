import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const statusApi = createApi({
  reducerPath: "statusApi",
  baseQuery,
  tagTypes: ["Status"],
  endpoints: (builder) => ({
    getStationStatuses: builder.query({
      query: ({ stationId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/status/station/${stationId}?${params.toString()}`;
      },
      providesTags: ["Status"],
    }),

    getAllStationStatuses: builder.query({
      query: ({ stationId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/status/station/${stationId}/all?${params.toString()}`;
      },
      providesTags: ["Status"],
    }),

    getStatusById: builder.query({
      query: (id) => `/status/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Status", id }],
    }),

    createStatus: builder.mutation({
      query: ({ content, media, expiresAt }) => ({
        url: "/status",
        method: "POST",
        body: { content, media, expiresAt },
      }),
      invalidatesTags: ["Status"],
    }),

    deleteStatus: builder.mutation({
      query: (id) => ({
        url: `/status/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Status"],
    }),

    uploadStatusMedia: builder.mutation({
      query: (file: File) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: "/status/upload-media",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetStationStatusesQuery,
  useGetAllStationStatusesQuery,
  useGetStatusByIdQuery,
  useCreateStatusMutation,
  useDeleteStatusMutation,
  useUploadStatusMediaMutation,
} = statusApi;
