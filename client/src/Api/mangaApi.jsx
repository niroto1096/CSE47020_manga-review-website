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

export const getCommentsApi = (mangaId, page = 1, limit = 20) =>
  API.get(`/comments`, { params: { mangaId, page, limit } });

export const reactCommentApi = (commentId, userId) =>
  API.post(`/comments/${commentId}/react`, { userId }); // if no auth middleware yet

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
