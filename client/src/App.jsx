// App.jsx
import React, { useContext, useEffect } from "react"; // ✅ import useEffect
import { Route, Routes, Navigate, useLocation } from "react-router-dom";

import Registration from "./Pages/registration";
import Otp from "./Pages/otp";
import Login from "./Pages/login";
import PublicRoute from "./Routes/publicRoute";
import ProtectedRoute from "./Routes/protectedRoute";

import Unauthorized from "./Pages/unauthorized";
import Navbar from "./Pages/navbar";
import Home from "./Pages/Home";
import AllManga from "./Pages/AllManga";
import UploadManga from "./Pages/uploadManga";
import UserManga from "./Pages/userManga";
import Details from "./Pages/Details";
import Profile from "./Pages/Profile";
// New pages (added safely)
import Feed from "./Pages/Feed";
import UserProfile from "./Pages/UserProfile";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import UserProvider, { UserContext } from "./Context/UserContext";

function App() {
  const location = useLocation();
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored || "dark"; // default = dark
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [location.pathname]);

  return (
    <UserProvider>
      {/* optional: global bg/text so pages reflect theme */}
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Navbar />
        <AppRoutes />
      </div>
    </UserProvider>
  );
}

function AppRoutes() {
  const { role } = useContext(UserContext); // ✅ inside provider

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

      {/* Root: Home if logged in, otherwise Login */}
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
            <Details />
          </ProtectedRoute>
        }
      />
      {/* New routes: do not affect existing ones */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute role={["user", "admin"]}>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/:id"
        element={
          <ProtectedRoute role={["user", "admin"]}>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
