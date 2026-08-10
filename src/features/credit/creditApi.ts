import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

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
