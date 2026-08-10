import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/features/api/baseApi";

export const challengeApi = createApi({
  reducerPath: "challengeApi",
  baseQuery,
  tagTypes: ["Challenge"],
  endpoints: (builder) => ({
    getChallenges: builder.query({
      query: (params?: { page?: number; limit?: number; station?: string; status?: string; type?: string; search?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.station) searchParams.set("station", params.station);
        if (params?.status) searchParams.set("status", params.status);
        if (params?.type) searchParams.set("type", params.type);
        if (params?.search) searchParams.set("search", params.search);
        return `/challenge?${searchParams.toString()}`;
      },
      providesTags: ["Challenge"],
    }),
    getChallengeById: builder.query({
      query: (id: string) => `/challenge/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Challenge", id }],
    }),
    getStationChallenges: builder.query({
      query: ({ stationId, page = 1, limit = 20, status }: { stationId: string; page?: number; limit?: number; status?: string }) => {
        const searchParams = new URLSearchParams();
        searchParams.set("page", String(page));
        searchParams.set("limit", String(limit));
        if (status) searchParams.set("status", status);
        return `/challenge?station=${stationId}&${searchParams.toString()}`;
      },
      providesTags: ["Challenge"],
    }),
    createChallenge: builder.mutation({
      query: (body: {
        station?: string;
        title: string;
        type: string;
        description: string;
        instructions?: string;
        startDate: string;
        startTime: string;
        endDate: string;
        endTime: string;
        questions: { text: string; options: { label: string; isCorrect: boolean }[]; timeLimit?: number }[];
        billingMode?: string;
        creditCost?: number;
        rewardText?: string;
        prizeType?: string;
        prizeTypeKey?: string;
        prizeLabel?: string;
        prizeValue?: string;
        currency?: string;
        numberOfWinners?: number;
        sponsorName?: string;
        collectionInstructions?: string;
      }) => ({
        url: "/challenge",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Challenge"],
    }),
    getAdminLeaderboard: builder.query({
      query: ({ id, page = 1, limit = 50 }: { id: string; page?: number; limit?: number }) =>
        `/challenge/${id}/leaderboard-admin?page=${page}&limit=${limit}`,
      providesTags: (_result, _error, { id }) => [{ type: "Challenge", id: `LEADERBOARD-${id}` }],
    }),
    cancelChallenge: builder.mutation({
      query: (id: string) => ({
        url: `/challenge/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["Challenge"],
    }),
    updateChallenge: builder.mutation({
      query: ({ id, ...body }: { id: string; title?: string; description?: string; status?: string; rewardText?: string }) => ({
        url: `/challenge/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Challenge"],
    }),
    deleteChallenge: builder.mutation({
      query: (id: string) => ({
        url: `/challenge/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Challenge"],
    }),
  }),
});

export const {
  useGetChallengesQuery,
  useGetChallengeByIdQuery,
  useGetStationChallengesQuery,
  useGetAdminLeaderboardQuery,
  useCreateChallengeMutation,
  useCancelChallengeMutation,
  useUpdateChallengeMutation,
  useDeleteChallengeMutation,
} = challengeApi;
