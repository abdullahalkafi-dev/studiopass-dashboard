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

export const countryApi = createApi({
  reducerPath: "countryApi",
  baseQuery,
  tagTypes: ["Country"],
  endpoints: (builder) => ({
    getCountries: builder.query({
      query: () => "/country",
      providesTags: ["Country"],
    }),
    updateCountry: builder.mutation({
      query: ({ id, ...body }: { id: string; messageCreditPrice?: number; callCreditPrice?: number }) => ({
        url: `/country/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Country"],
    }),
  }),
});

export const { useGetCountriesQuery, useUpdateCountryMutation } = countryApi;
