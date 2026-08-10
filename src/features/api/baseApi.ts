import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/store";

export const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

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
  ],
  endpoints: () => ({}),
});
