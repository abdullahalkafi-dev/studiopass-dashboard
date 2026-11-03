import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";
import { RootState } from "@/store/store";

export interface DisbursementItem {
  _id: string;
  challenge: { _id: string; title?: string; name?: string } | string;
  winnerUser: { _id: string; fullName?: string; phone?: string; avatar?: string } | string;
  winnerName: string;
  phone: string;
  station: { _id: string; name?: string; category?: string } | string;
  prizeTypeKey: string;
  prizeLabel: string;
  prizeValue: string;
  txRef?: string;
  provider?: string;
  providerReference?: string;
  manualNote?: string;
  markedPaidAt?: string;
  failureReason?: string;
  status: "pending" | "processing" | "successful" | "failed" | "cancelled";
  createdAt: string;
}

export interface DisbursementResponse {
  data: DisbursementItem[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}

export const disbursementApi = createApi({
  refetchOnReconnect: true,
  reducerPath: "disbursementApi",
  baseQuery,
  tagTypes: ["Disbursement"],
  endpoints: (builder) => ({
    getDisbursements: builder.query<
      DisbursementResponse,
      { status?: string; station?: string; search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/disbursement",
        params,
      }),
      providesTags: ["Disbursement"],
    }),
    retryDisbursement: builder.mutation<{ data: DisbursementItem }, string>({
      query: (id) => ({
        url: `/disbursement/${id}/retry`,
        method: "POST",
      }),
      invalidatesTags: ["Disbursement"],
    }),
    // Record a mobile money prize that accounts paid outside the system (e.g. MTN winners)
    markDisbursementPaid: builder.mutation<
      { data: DisbursementItem },
      { id: string; reference: string; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/disbursement/${id}/mark-paid`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Disbursement"],
    }),
  }),
});

export const {
  useGetDisbursementsQuery,
  useRetryDisbursementMutation,
  useMarkDisbursementPaidMutation,
} = disbursementApi;
