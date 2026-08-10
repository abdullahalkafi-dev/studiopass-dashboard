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
  status: "pending" | "processing" | "successful" | "failed" | "cancelled";
  createdAt: string;
}

export interface DisbursementResponse {
  data: DisbursementItem[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}

export const disbursementApi = createApi({
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
  }),
});

export const { useGetDisbursementsQuery } = disbursementApi;
