import { baseApi } from "@/features/api/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStationAdmins: builder.query({
      query: (params?: { page?: number; limit?: number; search?: string; station?: string; isActive?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.station) searchParams.set("station", params.station);
        if (params?.isActive) searchParams.set("isActive", params.isActive);
        return `/user/station-admins?${searchParams.toString()}`;
      },
      providesTags: ["User"],
    }),
    getCustomerCareUsers: builder.query({
      query: (params?: { page?: number; limit?: number; search?: string; country?: string; isActive?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.country) searchParams.set("country", params.country);
        if (params?.isActive) searchParams.set("isActive", params.isActive);
        return `/user/customer-care?${searchParams.toString()}`;
      },
      providesTags: ["User"],
    }),
    getTopFans: builder.query({
      query: () => "/user/top-fans",
      providesTags: ["User"],
    }),
    getTopFanById: builder.query({
      query: (id: string) => `/user/top-fans/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User" as const, id }],
    }),
    getUserById: builder.query({
      query: (id: string) => `/user/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    deactivateUser: builder.mutation({
      query: (id: string) => ({
        url: `/user/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
    reactivateUser: builder.mutation({
      query: (id: string) => ({
        url: `/user/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation({
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
      invalidatesTags: ["User"],
    }),
    updateMyProfile: builder.mutation({
      query: (body: FormData | { fullName?: string; email?: string; phone?: string; avatar?: string }) => ({
        url: "/user/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    getMyProfile: builder.query<any, void>({
      query: () => "/user/profile",
      providesTags: ["User"],
    }),
    getPresenters: builder.query({
      query: (stationId?: any) => {
        // stationId may be a populated Mongoose doc (object) — extract the string ID defensively
        const id = stationId && typeof stationId === "object"
          ? (stationId._id?.toString() || stationId.id?.toString())
          : stationId;
        const qs = id ? `?station=${id}` : "";
        return `/user/presenters${qs}`;
      },
      providesTags: ["User"],
    }),
    createCustomerCareAgent: builder.mutation({
      query: (body: { fullName: string; username: string; email?: string; phone?: string; password: string; scopeType?: "global" | "country"; countryId?: string }) => ({
        url: "/user/create-customer-care",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetStationAdminsQuery,
  useGetCustomerCareUsersQuery,
  useGetTopFansQuery,
  useGetTopFanByIdQuery,
  useGetUserByIdQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUpdateUserMutation,
  useUpdateMyProfileMutation,
  useGetMyProfileQuery,
  useGetPresentersQuery,
  useCreateCustomerCareAgentMutation,
} = userApi;
