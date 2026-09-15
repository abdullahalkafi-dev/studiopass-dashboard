import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/store";
import { updateToken, logout, setCredentials } from "@/features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Mutex lock to prevent parallel refresh race conditions against Redis blacklist
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth?.refreshToken;

    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const refreshResult = await rawBaseQuery(
              {
                url: "/auth/refresh",
                method: "POST",
                body: { refreshToken },
              },
              api,
              extraOptions
            );

            if (refreshResult.data) {
              const resData = refreshResult.data as any;
              const newAccessToken = resData.data?.accessToken;
              const newRefreshToken = resData.data?.refreshToken || refreshToken;

              if (newAccessToken) {
                if (state.auth.user) {
                  api.dispatch(
                    setCredentials({
                      user: state.auth.user,
                      accessToken: newAccessToken,
                      refreshToken: newRefreshToken,
                    })
                  );
                } else {
                  api.dispatch(updateToken(newAccessToken));
                }
                return true;
              }
            }
            api.dispatch(logout());
            return false;
          } catch {
            api.dispatch(logout());
            return false;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        // Retry the original failed query with the fresh access token
        result = await rawBaseQuery(args, api, extraOptions);
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery,
  tagTypes: [
    "User",
    "Presenter",
    "MediaStation",
    "Station",
    "Partner",
    "Country",
    "Show",
    "Message",
    "Pending",
    "Thread",
    "Credit",
    "CRM",
    "Statement",
    "Poll",
    "Template",
    "Dashboard",
    "StationApiKey",
    "Call",
    "Notification",
    "Status",
    "Challenge",
    "ChannelPoll",
    "PrizeType",
    "Disbursement",
    "SupportTicket",
    "SupportMessage",
    "DeviceSession",
  ],
  endpoints: () => ({}),
});
