import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8000/api/manga", 
    withCredentials: true,
  });

export const uploadManga = (formData) =>
  API.post("/upload-manga", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });



export const getAllManga = ( search = '') =>
  API.get('/get-all-manga', {
    params: { search },
  });

  export const deleteManga = (id)=>API.delete(`/delete-manga/${id}`)
  export const updateManga = (id,status) =>API.put(`/update-manga/${id}`,{status})
  export const getMangaById = (id) =>API.get(`/get-manga-by-id/${id}`)
