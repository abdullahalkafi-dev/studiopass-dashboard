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

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
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
  }),
});

export const {
  useGetStationAdminsQuery,
  useGetUserByIdQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
} = userApi;
