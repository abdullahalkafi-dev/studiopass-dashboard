import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export interface CreditPackageAdmin {
  id: string;
  label: string;
  amountUgx: number;
  credits: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackageInput {
  label: string;
  amountUgx: number;
  credits: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PayoutLimits {
  /** Maximum prize for one winner (UGX). Applies to mobile money and airtime prizes. */
  maxPerWinnerUgx: number;
  /** Maximum total of automated prizes (mobile money + airtime) per day, Uganda time (UGX). 0 = no limit. */
  dailyLimitUgx: number;
}

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery,
  tagTypes: ["CreditPackage", "PayoutLimits"],
  endpoints: (builder) => ({
    getCreditPackages: builder.query<{ success: boolean; data: CreditPackageAdmin[] }, void>({
      query: () => "/payment/admin/packages",
      providesTags: ["CreditPackage"],
    }),
    createCreditPackage: builder.mutation<{ success: boolean; data: CreditPackageAdmin }, CreditPackageInput>({
      query: (body) => ({ url: "/payment/admin/packages", method: "POST", body }),
      invalidatesTags: ["CreditPackage"],
    }),
    updateCreditPackage: builder.mutation<
      { success: boolean; data: CreditPackageAdmin },
      { id: string; patch: Partial<CreditPackageInput> }
    >({
      query: ({ id, patch }) => ({ url: `/payment/admin/packages/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: ["CreditPackage"],
    }),
    getPayoutLimits: builder.query<{ success: boolean; data: PayoutLimits }, void>({
      query: () => "/payment/admin/payout-limits",
      providesTags: ["PayoutLimits"],
    }),
    updatePayoutLimits: builder.mutation<{ success: boolean; data: PayoutLimits }, Partial<PayoutLimits>>({
      query: (body) => ({ url: "/payment/admin/payout-limits", method: "PATCH", body }),
      invalidatesTags: ["PayoutLimits"],
    }),
  }),
});

export const {
  useGetCreditPackagesQuery,
  useCreateCreditPackageMutation,
  useUpdateCreditPackageMutation,
  useGetPayoutLimitsQuery,
  useUpdatePayoutLimitsMutation,
} = paymentApi;
