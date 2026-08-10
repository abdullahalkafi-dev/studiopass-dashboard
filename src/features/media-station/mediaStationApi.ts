import { baseApi } from "@/features/api/baseApi";

export const mediaStationApi = baseApi.injectEndpoints({
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
    updateMediaStation: builder.mutation({
      query: ({
        id,
        ...body
      }: {
        id: string;
        fullName?: string;
        email?: string;
        phone?: string;
        stationId?: string;
        password?: string;
      }) => ({
        url: `/user/${id}`,
        method: "PATCH",
        body,
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
  useUpdateMediaStationMutation,
} = mediaStationApi;
