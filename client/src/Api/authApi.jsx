import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/auth",
  withCredentials: true,
});

export const registration = (data) => API.post("/registration", data);
export const verifyOTP = (email, otp) => API.post("/verify-otp", { email, otp });
export const resendOTPApi = (email) => API.post("/resend-otp", { email });

// 2FA Authentication
export const logIn = (email, password) => API.post("/login", { email, password });
export const verifyLogin2FAApi = (email, otp) => API.post("/login/verify-2fa", { email, otp });

// Sessions
export const verifyUser = () => API.get("/verify-user");
export const logOut = () => API.get("/log-out");

// User Profile & Avatar
export const uploadAvatar = (formData) =>
  API.post("/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const addFavoriteApi = (mangaId) => API.post("/favorites/add", { mangaId });
export const removeFavoriteApi = (mangaId) => API.post("/favorites/remove", { mangaId });
export const getFavoritesApi = () => API.get("/favorites");

// Social
export const followApi = (targetUserId) => API.post("/follow", { targetUserId });
export const unfollowApi = (targetUserId) => API.post("/unfollow", { targetUserId });
export const getFeedApi = () => API.get("/feed");
export const getPublicUserApi = (id) => API.get(`/user/${id}`);

// Privacy
export const updatePrivacyApi = (payload) => API.post("/privacy", payload);
export const getFavoritesPublicApi = (id) => API.get(`/user/${id}/favorites-public`);
export const getPersonalListPublicApi = (id) => API.get(`/user/${id}/personal-list-public`);
export const getUserReviewsPublicApi = (id) => API.get(`/user/${id}/reviews-public`);

// Key Management Module
export const getPublicKeysApi = () => API.get("/crypto/keys");
export const rotateKeysApi = (keyType) => API.post("/crypto/rotate", { keyType });