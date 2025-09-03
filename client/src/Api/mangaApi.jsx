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