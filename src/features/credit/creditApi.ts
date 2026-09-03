import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const creditApi = createApi({
  reducerPath: "creditApi",
  baseQuery,
  tagTypes: ["Credit", "Listener"],
  endpoints: (builder) => ({
    getBalance: builder.query({
      query: (userId) => `/credit/balance?userId=${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Credit", id: userId },
        "Credit",
      ],
    }),

    addCredits: builder.mutation({
      query: ({ userId, amount, isFree = true, reason }) => ({
        url: "/credit/add",
        method: "POST",
        body: { userId, amount, isFree, reason },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Credit", id: userId },
        "Credit",
        "Listener",
      ],
    }),

    deductCredits: builder.mutation({
      query: ({ userId, amount, reason }) => ({
        url: "/credit/deduct",
        method: "POST",
        body: { userId, amount, reason },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Credit", id: userId },
        "Credit",
        "Listener",
      ],
    }),

    getTransactions: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (userId) params.set("userId", String(userId));
        params.set("page", String(page));
        params.set("limit", String(limit));
        return `/credit/transactions?${params.toString()}`;
      },
      providesTags: (_result, _error, { userId }) => [
        { type: "Credit", id: userId },
        "Credit",
      ],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useAddCreditsMutation,
  useDeductCreditsMutation,
  useGetTransactionsQuery,
} = creditApi;
