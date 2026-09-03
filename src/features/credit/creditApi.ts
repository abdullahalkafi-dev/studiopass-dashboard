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
      query: (params?: {
        userId?: string;
        search?: string;
        country?: string;
        partner?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      }) => {
        const sp = new URLSearchParams();
        if (params?.userId) sp.set("userId", String(params.userId));
        if (params?.search) sp.set("search", params.search);
        if (params?.country) sp.set("country", params.country);
        if (params?.partner) sp.set("partner", params.partner);
        if (params?.status) sp.set("status", params.status);
        if (params?.startDate) sp.set("startDate", params.startDate);
        if (params?.endDate) sp.set("endDate", params.endDate);
        if (params?.page) sp.set("page", String(params.page));
        if (params?.limit) sp.set("limit", String(params.limit));
        return `/credit/transactions?${sp.toString()}`;
      },
      providesTags: ["Credit"],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useAddCreditsMutation,
  useDeductCreditsMutation,
  useGetTransactionsQuery,
} = creditApi;
