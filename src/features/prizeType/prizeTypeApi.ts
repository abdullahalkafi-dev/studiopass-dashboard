import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";
import { RootState } from "@/store/store";

export interface PrizeType {
  _id: string;
  key: string;
  label: string;
  category: "automated" | "physical" | "manual";
  unit?: string;
  requiresAmount: boolean;
  requiresDescription: boolean;
  requiresSponsor: boolean;
  requiresInstructions: boolean;
  isActive: boolean;
}

export const prizeTypeApi = createApi({
  reducerPath: "prizeTypeApi",
  baseQuery,
  tagTypes: ["PrizeType"],
  endpoints: (builder) => ({
    getPrizeTypes: builder.query<PrizeType[], void>({
      query: () => "/prize-type",
      transformResponse: (response: { data: PrizeType[] }) => response.data,
      providesTags: ["PrizeType"],
    }),
  }),
});

export const { useGetPrizeTypesQuery } = prizeTypeApi;
