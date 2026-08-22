import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { logOut } from "@/Api/authApi";
import { getAllManga } from "@/Api/mangaApi";
import { Button } from "@/components/ui/button";
const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const Navbar = () => {
  const { role, setRole } = useContext(UserContext);

  useEffect(() => {
    if (!role) setRole(localStorage.getItem("role"));
  }, []);

  const [avatar, setAvatar] = useState(null);
  useEffect(() => {
    // lazy load verify user to fetch avatar (non-blocking)
    (async () => {
      try {
        const res = await (await import('@/Api/authApi')).verifyUser();
        const u = res?.data?.user;
        if (u?.avatar) setAvatar(u.avatar);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await logOut();
      setRole(null);
      localStorage.removeItem("role");
      navigate("/login");
    } catch (error) {
      console.log("Logout failed:", error);
    }
  };

  const handleSurprise = async () => {
    try {
      const res = await getAllManga("");
      const all = res?.data?.manga || res?.data || [];
      if (!Array.isArray(all) || all.length === 0) return;
      const pick = all[Math.floor(Math.random() * all.length)];
      const id = String(pick?._id || pick?.id || "");
      if (id) navigate(`/manga-detail/${id}`);
    } catch (err) {
      console.error('Surprise fetch failed', err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#203771] shadow-md dark:bg-gray-900">
      <nav className="w-full px-6 md:px-12 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-blue-600 dark:text-blue-400"
        >
          MangaVerse
        </Link>

        <div className="hidden md:flex space-x-6 items-center">
          <Link
            to="/"
            className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400"
          >
            Home
          </Link>

          {role === "admin" && (
            <>
              <Link
                to="/upload"
                className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400"
              >
                Upload
              </Link>
              <Link
                to="/admin-manga"
                className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400"
              >
                Manage
              </Link>
            </>
          )}

          {role && (
            <>
              <Link
                to="/all-manga"
                className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400"
              >
                Browse
              </Link>
              <button onClick={handleSurprise} className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400">🎲 Surprise Me!</button>
              <Link to="/profile" className="flex items-center gap-2">
                {avatar && (
                  <img src={`${IMAGE_BASE}/${avatar.startsWith('uploads/') ? avatar : `uploads/${avatar}`}`} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                )}
                <span className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400">Profile</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="outline"
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 text-sm border border-gray-400 dark:border-gray-600"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </Button>

          {role ? (
            <Button onClick={handleLogout} className="bg-white text-black dark:bg-black dark:text-white">
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button className="bg-white text-black dark:bg-black dark:text-white">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
export default Navbar;
