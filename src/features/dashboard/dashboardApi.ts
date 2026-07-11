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

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),

    getMessageActivity: builder.query({
      query: ({ period = "monthly" }) =>
        `/dashboard/message-activity?period=${period}`,
      providesTags: ["Dashboard"],
    }),

    getStationOverview: builder.query({
      query: () => "/dashboard/station-overview",
      providesTags: ["Dashboard"],
    }),

    getRecentActivity: builder.query({
      query: ({ limit = 10 }) => `/dashboard/recent-activity?limit=${limit}`,
      providesTags: ["Dashboard"],
    }),

    getTopStations: builder.query({
      query: ({ limit = 5 }) => `/dashboard/top-stations?limit=${limit}`,
      providesTags: ["Dashboard"],
    }),

    getRecentUsers: builder.query({
      query: ({ limit = 6 }) => `/dashboard/recent-users?limit=${limit}`,
      providesTags: ["Dashboard"],
    }),

    getCreditStats: builder.query({
      query: () => "/dashboard/credit-stats",
      providesTags: ["Dashboard"],
    }),

    getCountryRevenue: builder.query({
      query: () => "/dashboard/country-revenue",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetMessageActivityQuery,
  useGetStationOverviewQuery,
  useGetRecentActivityQuery,
  useGetTopStationsQuery,
  useGetRecentUsersQuery,
  useGetCreditStatsQuery,
  useGetCountryRevenueQuery,
} = dashboardApi;
