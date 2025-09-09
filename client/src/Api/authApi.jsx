import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8000/api/auth", 
    withCredentials: true,
  });

export const registration = (data) =>API.post('/registration',data)
export const verifyOTP = (email,otp) =>API.post('/verify-otp',{email,otp})
export const logIn = (email,password) =>API.post('/login',{email,password})
export const verifyUser = () =>API.get('/verify-user')
export const logOut = () =>API.get('/log-out')
export const uploadAvatar = (formData) => API.post('/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const addFavoriteApi = (mangaId) => API.post('/favorites/add', { mangaId })
export const removeFavoriteApi = (mangaId) => API.post('/favorites/remove', { mangaId })
export const getFavoritesApi = () => API.get('/favorites')