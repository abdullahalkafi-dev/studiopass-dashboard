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

export const partnerApi = createApi({
  reducerPath: "partnerApi",
  baseQuery,
  tagTypes: ["Partner"],
  endpoints: (builder) => ({
    getPartners: builder.query({
      query: (params?: { page?: number; limit?: number; country?: string; isActive?: string; search?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.country) searchParams.set("country", params.country);
        if (params?.isActive) searchParams.set("isActive", params.isActive);
        if (params?.search) searchParams.set("search", params.search);
        return `/partner?${searchParams.toString()}`;
      },
      providesTags: ["Partner"],
    }),
    getPartnerById: builder.query({
      query: (id: string) => `/partner/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Partner", id }],
    }),
    createPartner: builder.mutation({
      query: (body: {
        partnerName: string;
        countryId: string;
        contactEmail?: string;
        contactPhone?: string;
        adminFullName: string;
        adminUsername: string;
        adminPassword: string;
      }) => ({
        url: "/partner",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Partner"],
    }),
    updatePartner: builder.mutation({
      query: ({ id, ...body }: { id: string; name?: string; contactEmail?: string; contactPhone?: string; status?: string }) => ({
        url: `/partner/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Partner"],
    }),
    deactivatePartner: builder.mutation({
      query: (id: string) => ({
        url: `/partner/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Partner"],
    }),
    reactivatePartner: builder.mutation({
      query: (id: string) => ({
        url: `/partner/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Partner"],
    }),
  }),
});

export const {
  useGetPartnersQuery,
  useGetPartnerByIdQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeactivatePartnerMutation,
  useReactivatePartnerMutation,
} = partnerApi;
