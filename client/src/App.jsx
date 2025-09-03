// App.jsx
import React, { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import Registration from "./Pages/registration";
import Otp from "./Pages/otp";
import Login from "./Pages/login";
import PublicRoute from "./Routes/publicRoute";
import ProtectedRoute from "./Routes/protectedRoute";

import Unauthorized from "./Pages/Unauthorized";
import Navbar from "./Pages/Navbar";
import Home from "./Pages/Home";
import AllManga from "./Pages/AllManga";
import UploadManga from "./Pages/uploadManga";
import UserManga from "./Pages/userManga";
import Details from "./Pages/Details";
import Profile from "./Pages/Profile";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import UserProvider, { UserContext } from "./Context/UserContext";

function App() {
  return (
    <UserProvider>
      <Navbar />
      <AppRoutes />
    </UserProvider>
  );
}

function AppRoutes() {
  const { role } = useContext(UserContext); // ✅ now inside the provider

  return (
    <Routes>
      {/* Public pages */}
      <Route
        path="/registration"
        element={
          <PublicRoute>
            <Registration />
          </PublicRoute>
        }
      />
      <Route path="/otp" element={<Otp />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Root: Home if logged in, otherwise Login via PublicRoute */}
      <Route
        path="/"
        element={
          role ? (
            <Home />
          ) : (
            <PublicRoute>
              <Login />
            </PublicRoute>
          )
        }
      />

      {/* Admin-only */}
      <Route
        path="/upload"
        element={
          <ProtectedRoute role={["admin"]}>
            <UploadManga />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-manga"
        element={
          <ProtectedRoute role={["admin"]}>
            <AllManga />
          </ProtectedRoute>
        }
      />

      {/* User-only */}
      <Route
        path="/all-manga"
        element={
          <ProtectedRoute role={["user", "admin"]}>
            <UserManga />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute role={["user", "admin"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manga-detail/:id"
        element={
          <ProtectedRoute role={["user", "admin"]}>
            <Details /> {/* or <Details /> if that’s your detail page */}
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
