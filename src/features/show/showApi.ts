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

export const showApi = createApi({
  reducerPath: "showApi",
  baseQuery,
  tagTypes: ["Show"],
  endpoints: (builder) => ({
    getShowsByStation: builder.query({
      query: (stationId: string) => `/show?station=${stationId}`,
      providesTags: ["Show"],
    }),
  }),
});

export const { useGetShowsByStationQuery } = showApi;
