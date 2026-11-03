import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/store";
import { logout, setCredentials } from "@/features/auth/authSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/** A request that has not answered after this long is treated as a network failure, not left spinning. */
const REQUEST_TIMEOUT_MS = 20_000;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// ─── Session refresh ─────────────────────────────────────────────────────────

/**
 * Outcome of asking the server for a new access token.
 * Only "rejected" means the session is really over. "unavailable" (no network, timeout, server
 * restarting, rate limited) must never log anybody out: a studio left running all day would otherwise
 * be signed out by a 30-second backend restart.
 */
export type RefreshOutcome = "ok" | "rejected" | "unavailable";

type StoreApi = {
  getState: () => unknown;
  dispatch: (action: any) => unknown;
};

// One refresh at a time for the whole page; everybody who needs it waits for the same answer
let refreshInFlight: Promise<RefreshOutcome> | null = null;

export function refreshSession(api: StoreApi): Promise<RefreshOutcome> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<RefreshOutcome> => {
    // Read at the moment of use: another tab may have rotated it while this request was waiting
    const auth = (api.getState() as RootState).auth;
    const refreshToken = auth?.refreshToken;
    if (!refreshToken) return "rejected";

    // Two tries: a single dropped packet must not end a session
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));

        if (response.ok) {
          const body = await response.json();
          const accessToken = body?.data?.accessToken as string | undefined;
          const newRefreshToken = (body?.data?.refreshToken as string | undefined) || refreshToken;
          if (accessToken) {
            const current = (api.getState() as RootState).auth;
            if (current.user) {
              api.dispatch(
                setCredentials({ user: current.user, accessToken, refreshToken: newRefreshToken }),
              );
            }
            return "ok";
          }
          return "unavailable";
        }

        // The server understood the token and refused it: the session is over
        if ([400, 401, 403, 404].includes(response.status)) return "rejected";
        // 429 / 5xx: try once more, then keep the session
      } catch {
        // network error / timeout: try once more, then keep the session
      }
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return "unavailable";
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

// ─── Base query ──────────────────────────────────────────────────────────────

const NO_ANSWER = new Set<unknown>(["FETCH_ERROR", "TIMEOUT_ERROR"]);

/** Login, 2FA and password calls answer 401 for "wrong credentials", which is not an expired session. */
const isCredentialCall = (args: string | FetchArgs): boolean => {
  const url = typeof args === "string" ? args : args.url;
  return /^\/?auth\/(login|2fa|change-password|logout|refresh)/.test(url);
};

const methodOf = (args: string | FetchArgs): string =>
  (typeof args === "string" ? "GET" : args.method || "GET").toUpperCase();

/**
 * Sends the request; a GET that got no answer at all is repeated (twice, with a short pause).
 * Writes (POST/PUT/PATCH/DELETE) are never repeated: the server may already have acted on them.
 */
async function sendWithRetry(
  args: string | FetchArgs,
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
) {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (methodOf(args) !== "GET") return result;
  for (let attempt = 0; attempt < 2 && result.error && NO_ANSWER.has(result.error.status); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    result = await rawBaseQuery(args, api, extraOptions);
  }
  return result;
}

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const tokenUsed = (api.getState() as RootState).auth?.token ?? null;
  let result = await sendWithRetry(args, api, extraOptions);

  if (result.error?.status === 401 && !isCredentialCall(args)) {
    const auth = (api.getState() as RootState).auth;

    if (!auth?.refreshToken) {
      // Nothing to refresh with: not signed in (or already signed out)
      if (auth?.isAuthenticated) api.dispatch(logout());
      return result;
    }

    if (auth.token && auth.token !== tokenUsed) {
      // Somebody (another request, or another tab) already got a new token since this request left
      result = await sendWithRetry(args, api, extraOptions);
    } else {
      const outcome = await refreshSession(api);
      if (outcome === "ok") {
        result = await sendWithRetry(args, api, extraOptions);
      } else if (outcome === "rejected") {
        api.dispatch(logout());
      }
      // "unavailable": keep the session, the caller just sees this request fail and can retry
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery,
  refetchOnReconnect: true,
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
