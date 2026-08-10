import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const countryApi = createApi({
  reducerPath: "countryApi",
  baseQuery,
  tagTypes: ["Country"],
  endpoints: (builder) => ({
    getCountries: builder.query<any, void>({
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
