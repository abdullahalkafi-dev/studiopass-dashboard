import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const templateApi = createApi({
  reducerPath: "templateApi",
  baseQuery,
  tagTypes: ["Template"],
  endpoints: (builder) => ({
    getTemplates: builder.query({
      query: () => "/message-template",
      providesTags: ["Template"],
    }),

    createTemplate: builder.mutation({
      query: (body: { text: string }) => ({
        url: "/message-template",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Template"],
    }),

    updateTemplate: builder.mutation({
      query: ({ id, text }: { id: string; text: string }) => ({
        url: `/message-template/${id}`,
        method: "PATCH",
        body: { text },
      }),
      invalidatesTags: ["Template"],
    }),

    deleteTemplate: builder.mutation({
      query: (id: string) => ({
        url: `/message-template/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Template"],
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = templateApi;
