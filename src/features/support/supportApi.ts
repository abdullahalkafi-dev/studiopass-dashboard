import { baseApi } from "@/features/api/baseApi";

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnassignedQueue: builder.query({
      query: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        return `/support/conversations/unassigned?${searchParams.toString()}`;
      },
      providesTags: ["SupportTicket"],
    }),

    getMyTickets: builder.query({
      query: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        return `/support/conversations/my-tickets?${searchParams.toString()}`;
      },
      providesTags: ["SupportTicket"],
    }),

    getClosedTickets: builder.query({
      query: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        return `/support/conversations/closed?${searchParams.toString()}`;
      },
      providesTags: ["SupportTicket"],
    }),

    getConversationMessages: builder.query({
      query: (id: string) => `/support/conversations/${id}/messages`,
      providesTags: (_result, _error, id) => [{ type: "SupportMessage", id }],
    }),

    claimTicket: builder.mutation({
      query: (id: string) => ({
        url: `/support/conversations/${id}/claim`,
        method: "PATCH",
      }),
      invalidatesTags: ["SupportTicket"],
    }),

    closeTicket: builder.mutation({
      query: (id: string) => ({
        url: `/support/conversations/${id}/close`,
        method: "PATCH",
      }),
      invalidatesTags: ["SupportTicket"],
    }),

    sendSupportMessage: builder.mutation({
      query: ({
        id,
        message,
        file,
        attachments,
      }: {
        id: string;
        message?: string;
        file?: File;
        attachments?: string[];
      }) => {
        if (file) {
          const formData = new FormData();
          if (message) formData.append("message", message);
          formData.append("image", file);
          return {
            url: `/support/conversations/${id}/messages`,
            method: "POST",
            body: formData,
          };
        }
        return {
          url: `/support/conversations/${id}/messages`,
          method: "POST",
          body: { message, attachments },
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "SupportMessage", id },
        "SupportTicket",
      ],
    }),

    searchSupportEntities: builder.query({
      query: (query: string) => `/support/search?query=${encodeURIComponent(query)}`,
    }),

    getSupportStats: builder.query({
      query: () => "/support/stats",
      providesTags: ["SupportTicket"],
    }),
  }),
});

export const {
  useGetUnassignedQueueQuery,
  useGetMyTicketsQuery,
  useGetClosedTicketsQuery,
  useGetConversationMessagesQuery,
  useClaimTicketMutation,
  useCloseTicketMutation,
  useSendSupportMessageMutation,
  useSearchSupportEntitiesQuery,
  useGetSupportStatsQuery,
} = supportApi;
