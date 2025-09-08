import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/manga",
  withCredentials: true,
});

// Upload Manga
export const uploadManga = (formData) =>
  API.post("/upload-manga", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Get all manga (with optional search)
export const getAllManga = (search = "") =>
  API.get("/get-all-manga", {
    params: { search },
  });

// Get single manga by ID
export const getMangaById = (id) => API.get(`/get-manga-by-id/${id}`);

// src/Api/mangaApi.jsx
// src/Api/mangaApi.jsx
export const addRating = (mangaId, { userId, rating }) =>
  API.post(`/add-rating/${mangaId}`, { userId, rating });
//            ^^^^^^^^^^^ matches your Express route

// Delete Manga
export const deleteManga = (id) => API.delete(`/delete-manga/${id}`);

// Update Manga status
export const updateManga = (id, status) =>
  API.put(`/update-manga/${id}`, { status });

// baseURL is http://localhost:8000/api/manga

export const getMyRating = (mangaId, userId) =>
  API.get(`/my-rating/${mangaId}`, { params: { userId } });

export const addCommentApi = (mangaId, comment, userId) =>
  API.post("/add-comment", { mangaId, comment, userId });

// get comments with pagination
export const getCommentsApi = (mangaId, page = 1, limit = 20, userId) =>
  API.get(`/comments`, { params: { mangaId, page, limit, userId } });

// toggle like/dislike
export const reactCommentApi = (commentId, userId, reaction) =>
  API.post(`/comments/${commentId}/react`, { userId, reaction });

// edit comment
export const editCommentApi = (commentId, comment, userId) =>
  API.put(`/comments/${commentId}`, { comment, userId });

// Review API functions
export const createOrUpdateReviewApi = (mangaId, review, rating, userId) =>
  API.post("/reviews", { mangaId, review, rating, userId });

export const getUserReviewApi = (mangaId, userId) =>
  API.get("/reviews/user", { params: { mangaId, userId } });

export const getMangaReviewsApi = (mangaId, page = 1, limit = 10) =>
  API.get("/reviews", { params: { mangaId, page, limit } });

export const deleteReviewApi = (reviewId, userId) =>
  API.delete(`/reviews/${reviewId}`, { data: { userId } });

// Review reactions
export const reactReviewApi = (reviewId, userId, reaction) =>
  API.post(`/reviews/${reviewId}/react`, { userId, reaction });

// Review summary
export const getReviewSummaryApi = (mangaId) =>
  API.get("/reviews/summary", { params: { mangaId } });

// Create or update a user's status for a manga
export const updatePersonalListStatus = (userId, mangaId, status) =>
  API.post("/personal-list/update", { userId, mangaId, status });

// Get the current status for a user + manga
// (Assumes you added a GET controller like /personal-list/status)
export const getPersonalListStatus = (userId, mangaId) =>
  API.get("/personal-list/status", { params: { userId, mangaId } });

// Optional: fetch paginated personal list for a user
export const getMyPersonalList = (userId, page = 1, limit = 20, status) =>
  API.get("/personal-list", { params: { userId, page, limit, status } });
