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

export const creditApi = createApi({
  reducerPath: "creditApi",
  baseQuery,
  tagTypes: ["Credit"],
  endpoints: (builder) => ({
    getBalance: builder.query({
      query: (userId) => `/credit/balance?userId=${userId}`,
      providesTags: ["Credit"],
    }),

    addCredits: builder.mutation({
      query: ({ userId, amount, isFree = true }) => ({
        url: "/credit/add",
        method: "POST",
        body: { userId, amount, isFree },
      }),
      invalidatesTags: ["Credit"],
    }),

    getTransactions: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (userId) params.set("userId", String(userId));
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/credit/transactions?${params.toString()}`;
      },
      providesTags: ["Credit"],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useAddCreditsMutation,
  useGetTransactionsQuery,
} = creditApi;
