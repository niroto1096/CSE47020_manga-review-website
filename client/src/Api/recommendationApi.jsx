import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const recommendationApi = createApi({
  reducerPath: "recommendationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/api/recommend",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getPersonalizedRecommendations: builder.query({
      query: () => "/recommendations",
    }),
    getTrendingManga: builder.query({
      query: () => "/trending",
    }),
  }),
});

export const {
  useGetPersonalizedRecommendationsQuery,
  useGetTrendingMangaQuery,
} = recommendationApi;

export default recommendationApi;