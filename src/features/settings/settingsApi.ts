import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

interface SecuritySettings {
  _id: string;
  enforce2FA: boolean;
  enforcedRoles: string[];
  updatedAt: string;
  createdAt: string;
}

interface AuditLogEntry {
  _id: string;
  action: string;
  status: string;
  userId?: string;
  authId?: string;
  usernameOrPhone?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,
  tagTypes: ["SecuritySettings", "AuditLog"],
  endpoints: (builder) => ({
    getSecuritySettings: builder.query<{ success: boolean; data: SecuritySettings }, void>({
      query: () => ({ url: "/settings/security", method: "GET" }),
      providesTags: ["SecuritySettings"],
    }),

    updateSecuritySettings: builder.mutation<
      { success: boolean; data: SecuritySettings },
      { enforce2FA?: boolean; enforcedRoles?: string[] }
    >({
      query: (body) => ({ url: "/settings/security", method: "PATCH", body }),
      invalidatesTags: ["SecuritySettings"],
    }),

    getAuditLogs: builder.query<
      { success: boolean; data: AuditLogEntry[]; meta: { page: number; limit: number; total: number; totalPage: number } },
      { page?: number; limit?: number; action?: string }
    >({
      query: ({ page = 1, limit = 20, action } = {}) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (action) params.set("action", action);
        return { url: `/audit-logs?${params.toString()}`, method: "GET" };
      },
      providesTags: ["AuditLog"],
    }),
  }),
});

export const {
  useGetSecuritySettingsQuery,
  useUpdateSecuritySettingsMutation,
  useGetAuditLogsQuery,
} = settingsApi;
