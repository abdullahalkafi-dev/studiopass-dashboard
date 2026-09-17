import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";
import type { RootState } from "@/store/store";
import { setCredentials, updateToken, updateUser } from "./authSlice";

const baseQueryWithReauth = async (
  args: any,
  api: any,
  extraOptions: any
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await baseQuery(
        { url: "/auth/refresh", method: "POST", body: { refreshToken } },
        api,
        extraOptions
      );
      if (refreshResult?.data) {
        const data = (refreshResult.data as any).data;
        api.dispatch(updateToken(data.accessToken));
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: "auth/logout" });
      }
    }
  }
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
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
