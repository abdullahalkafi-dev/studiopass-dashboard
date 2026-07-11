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

export const statementApi = createApi({
  reducerPath: "statementApi",
  baseQuery,
  tagTypes: ["Statement"],
  endpoints: (builder) => ({
    getStatements: builder.query({
      query: ({ page = 1, limit = 20, station, country, type, search, startDate, endDate }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (station) params.set("station", station);
        if (country) params.set("country", country);
        if (type) params.set("type", type);
        if (search) params.set("search", search);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        return `/listener-statement?${params.toString()}`;
      },
      providesTags: ["Statement"],
    }),

    getStatementById: builder.query({
      query: (id) => `/listener-statement/${id}`,
      providesTags: ["Statement"],
    }),

    getStatementKPIs: builder.query({
      query: ({ station, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (station) params.set("station", station);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        return `/listener-statement/kpis?${params.toString()}`;
      },
      providesTags: ["Statement"],
    }),

    exportStatements: builder.query({
      query: ({ station, country, type, format = "csv" }) => {
        const params = new URLSearchParams();
        if (station) params.set("station", station);
        if (country) params.set("country", country);
        if (type) params.set("type", type);
        params.set("format", format);
        return `/listener-statement/export?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetStatementsQuery,
  useGetStatementByIdQuery,
  useGetStatementKPIsQuery,
  useLazyExportStatementsQuery,
} = statementApi;
