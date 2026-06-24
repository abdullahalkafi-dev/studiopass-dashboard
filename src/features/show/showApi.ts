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

export interface ShowResponse {
  id: string;
  name: string;
  description?: string;
  station: { id: string; name: string; stationCode: string; category: string };
  presenter: { id: string; fullName: string; avatar?: string } | null;
  days: string[];
  startTime: string;
  endTime: string;
  status: "Active" | "Scheduled" | "Inactive";
  isActive: boolean;
  createdAt: string;
}

export interface MyShowItem {
  id: string;
  name: string;
  description?: string;
  station: { id: string; name: string; stationCode: string };
  presenter: { id: string; fullName: string } | null;
  days: string[];
  startTime: string;
  endTime: string;
  status: "Active" | "Scheduled" | "Inactive";
  timezone: string;
  timeRemainingMinutes?: number;
  nextStartTime?: { minutesUntil: number; nextDay: string };
}

export interface MyShowsResponse {
  assigned: boolean;
  currentShow: MyShowItem | null;
  nextShow: MyShowItem | null;
  allShows: MyShowItem[];
}

export const showApi = createApi({
  reducerPath: "showApi",
  baseQuery,
  tagTypes: ["Show"],
  endpoints: (builder) => ({
    getShows: builder.query({
      query: (params?: { station?: string; search?: string; status?: string; stationName?: string; presenterName?: string; page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.station) searchParams.set("station", params.station);
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.stationName) searchParams.set("stationName", params.stationName);
        if (params?.presenterName) searchParams.set("presenterName", params.presenterName);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        const qs = searchParams.toString();
        return `/show${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Show"],
    }),
    getShowsByStation: builder.query({
      query: (stationId: string) => `/show?station=${stationId}`,
      providesTags: ["Show"],
    }),
    getShowById: builder.query({
      query: (id: string) => `/show/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Show", id }],
    }),
    createShow: builder.mutation({
      query: (body: {
        name: string;
        stationId: string;
        presenterId?: string;
        startTime: string;
        endTime: string;
        days: string[];
        description?: string;
      }) => ({
        url: "/show",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Show"],
    }),
    getMyShows: builder.query({
      query: () => "/show/my-shows",
      providesTags: ["Show"],
    }),
  }),
});

export const { useGetShowsQuery, useGetShowsByStationQuery, useGetShowByIdQuery, useCreateShowMutation, useGetMyShowsQuery } = showApi;
