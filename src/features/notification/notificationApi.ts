import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export type Notification = {
  _id: string;
  user: string;
  type: "announcement" | "reply" | "system";
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  deliveryStatus: "pending" | "sent" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type NotificationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery,
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { data: Notification[]; meta: NotificationMeta },
      { page?: number; limit?: number; type?: string; isRead?: string }
    >({
      query: ({ page = 1, limit = 20, type, isRead } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (type) params.set("type", type);
        if (isRead !== undefined) params.set("isRead", isRead);
        return `/notification?${params.toString()}`;
      },
      providesTags: ["Notification"],
    }),
    getUnreadCount: builder.query<{ data: { count: number } }, void>({
      query: () => "/notification/unread-count",
      providesTags: ["Notification"],
    }),
    markAsRead: builder.mutation({
      query: (id: string) => ({
        url: `/notification/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notification/read-all",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    deleteNotification: builder.mutation({
      query: (id: string) => ({
        url: `/notification/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
