import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { logOut } from "@/Api/authApi";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { role, setRole } = useContext(UserContext);

  if (!role) {
    setRole(localStorage.getItem("role"));
  }

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
              <Link
                to="/profile"
                className="text-white hover:text-blue-600 font-medium dark:text-gray-200 dark:hover:text-blue-400"
              >
                Profile
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
            <Button onClick={handleLogout} className="text-white">
              Logout
            </Button>
          ) : (
            <Link to="/login">
              <Button className="text-white">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};
export default Navbar;
