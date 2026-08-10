import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export interface DashboardQueryParams {
  period?: string;
  country?: string;
  partnerId?: string;
  stationId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
}

const buildQueryString = (path: string, params?: DashboardQueryParams) => {
  const sp = new URLSearchParams();
  if (params?.period) sp.set("period", params.period);
  if (params?.country) sp.set("country", params.country);
  if (params?.partnerId) sp.set("partnerId", params.partnerId);
  if (params?.stationId) sp.set("stationId", params.stationId);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.startDate) sp.set("startDate", params.startDate);
  if (params?.endDate) sp.set("endDate", params.endDate);
  if (params?.dateRange) sp.set("dateRange", params.dateRange);
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
};

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/stats", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getMessageActivity: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/message-activity", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getRevenueActivity: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/revenue-activity", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getListenerActivity: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/listener-activity", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getCampaignActivity: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/campaign-activity", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getCallActivity: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/call-activity", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getCampaignStats: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/campaign-stats", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getCallOperationsStats: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/call-operations", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getRoleDistribution: builder.query<any, void>({
      query: () => "/dashboard/role-distribution",
      providesTags: ["Dashboard"],
    }),

    getStationOverview: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/station-overview", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getRecentActivity: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/recent-activity", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getTopStations: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/top-stations", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getRecentUsers: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/recent-users", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getCreditStats: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/credit-stats", params || undefined),
      providesTags: ["Dashboard"],
    }),

    getCountryRevenue: builder.query<any, DashboardQueryParams | void>({
      query: (params) => buildQueryString("/dashboard/country-revenue", params || undefined),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetMessageActivityQuery,
  useGetRevenueActivityQuery,
  useGetListenerActivityQuery,
  useGetCampaignActivityQuery,
  useGetCallActivityQuery,
  useGetCampaignStatsQuery,
  useGetCallOperationsStatsQuery,
  useGetRoleDistributionQuery,
  useGetStationOverviewQuery,
  useGetRecentActivityQuery,
  useGetTopStationsQuery,
  useGetRecentUsersQuery,
  useGetCreditStatsQuery,
  useGetCountryRevenueQuery,
} = dashboardApi;
