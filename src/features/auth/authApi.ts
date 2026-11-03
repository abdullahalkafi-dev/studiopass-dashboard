import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";
import type { RootState } from "@/store/store";
import { setCredentials, updateToken, updateUser } from "./authSlice";

// The shared base query already refreshes an expired access token (once, for the whole page) and only
// signs the user out when the server REFUSES the refresh token. A second refresh handler here used to
// rotate the token again on every 401 (for example a wrong password) and keep only the new access
// token, so the rotated refresh token was lost and the next refresh failed.
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  refetchOnReconnect: true,
  tagTypes: ["User", "Profile"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials: { username: string; password: string; deviceId?: string; deviceName?: string }) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Only save credentials if direct tokens are issued (non-2FA)
          if (data?.success && data.data?.accessToken) {
            dispatch(
              setCredentials({
                user: data.data.user || {
                  id: data.data.id,
                  role: data.data.role,
                  twoFactorEnabled: data.data.twoFactorEnabled,
                  sessionId: data.data.sessionId,
                  deviceId: data.data.deviceId,
                  isApprovedStudioDevice: data.data.isApprovedStudioDevice,
                },
                accessToken: data.data.accessToken,
                refreshToken: data.data.refreshToken,
              })
            );
          }
        } catch {}
      },
    }),

    verify2FALogin: builder.mutation({
      query: (body: { tempToken: string; code: string; deviceId?: string; deviceName?: string }) => ({
        url: "/auth/2fa/verify-login",
        method: "POST",
        body,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          if (data?.success && data.data?.accessToken) {
            dispatch(
              setCredentials({
                user: data.data.user || {
                  id: data.data.id,
                  role: data.data.role,
                  twoFactorEnabled: true,
                  sessionId: data.data.sessionId,
                  deviceId: data.data.deviceId,
                  isApprovedStudioDevice: data.data.isApprovedStudioDevice,
                },
                accessToken: data.data.accessToken,
                refreshToken: data.data.refreshToken,
              })
            );
          }
        } catch {}
      },
    }),

    setup2FAEnable: builder.mutation({
      query: (body: { tempToken?: string; code: string; deviceId?: string; deviceName?: string }) => ({
        url: "/auth/2fa/setup-enable",
        method: "POST",
        body,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          if (data?.success && data.data?.accessToken) {
            dispatch(
              setCredentials({
                user: data.data.user || {
                  id: data.data.id,
                  role: data.data.role,
                  twoFactorEnabled: true,
                  sessionId: data.data.sessionId,
                  deviceId: data.data.deviceId,
                  isApprovedStudioDevice: data.data.isApprovedStudioDevice,
                },
                accessToken: data.data.accessToken,
                refreshToken: data.data.refreshToken,
              })
            );
          } else if (data?.success) {
            dispatch(updateUser({ twoFactorEnabled: true }));
          }
        } catch {}
      },
    }),

    init2FASetup: builder.mutation<
      { success: boolean; data: { secret: string; qrCode: string } },
      void
    >({
      query: () => ({
        url: "/auth/2fa/setup-init",
        method: "POST",
      }),
    }),

    disable2FA: builder.mutation({
      query: (body: { password: string; code: string }) => ({
        url: "/auth/2fa/disable",
        method: "POST",
        body,
      }),
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            dispatch(updateUser({ twoFactorEnabled: false }));
          }
        } catch {}
      },
    }),

    resetUser2FA: builder.mutation<any, string>({
      query: (userId: string) => ({
        url: `/user/${userId}/reset-2fa`,
        method: "POST",
      }),
      invalidatesTags: ["User", "Profile"],
    }),

    changePassword: builder.mutation({
      query: (body: { currentPassword: string; newPassword: string }) => ({
        url: "/auth/change-password",
        method: "PATCH",
        body,
      }),
    }),

    logout: builder.mutation<any, { refreshToken?: string | null } | void>({
      query: (body?: { refreshToken?: string | null }) => ({
        url: "/auth/logout",
        method: "POST",
        body: body?.refreshToken ? { refreshToken: body.refreshToken } : {},
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useVerify2FALoginMutation,
  useSetup2FAEnableMutation,
  useInit2FASetupMutation,
  useDisable2FAMutation,
  useResetUser2FAMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;
