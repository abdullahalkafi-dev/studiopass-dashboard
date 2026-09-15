import { baseApi } from "@/features/api/baseApi";

export interface DeviceSessionItem {
  _id: string;
  userId: string;
  authId: string;
  stationId?: string;
  sessionId: string;
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  isApprovedStudioDevice: boolean;
  status: "active" | "revoked";
  approvedAt?: string;
  lastActiveAt: string;
  createdAt: string;
}

export const deviceSessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserSessions: builder.query<{ success: boolean; data: DeviceSessionItem[] }, string>({
      query: (userId: string) => `/device-sessions/user/${userId}`,
      providesTags: ["DeviceSession"],
    }),
    revokeSession: builder.mutation<{ success: boolean; message: string }, string>({
      query: (sessionId: string) => ({
        url: `/device-sessions/${sessionId}/remote-logout`,
        method: "POST",
      }),
      invalidatesTags: ["DeviceSession"],
    }),
    revokeAllUserSessions: builder.mutation<{ success: boolean; message: string }, string>({
      query: (userId: string) => ({
        url: `/device-sessions/user/${userId}/remote-logout-all`,
        method: "POST",
      }),
      invalidatesTags: ["DeviceSession"],
    }),
    toggleDeviceApproval: builder.mutation<
      { success: boolean; message: string; data: DeviceSessionItem },
      { sessionId: string; isApproved: boolean }
    >({
      query: ({ sessionId, isApproved }) => ({
        url: `/device-sessions/${sessionId}/toggle-approval`,
        method: "PATCH",
        body: { isApproved },
      }),
      invalidatesTags: ["DeviceSession"],
    }),
  }),
});

export const {
  useGetUserSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllUserSessionsMutation,
  useToggleDeviceApprovalMutation,
} = deviceSessionApi;
