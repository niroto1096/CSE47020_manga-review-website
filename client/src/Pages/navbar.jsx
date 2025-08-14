import React, { useContext } from "react";
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#203771] shadow-md">
      <nav className="w-full px-6 md:px-12 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          MangaVerse
        </Link>

        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="text-white hover:text-blue-600 font-medium">Home</Link>
          {role === "admin" && (
            <>
              <Link to="/upload" className="text-white hover:text-blue-600 font-medium">Upload</Link>
              <Link to="/admin-manga" className="text-white hover:text-blue-600 font-medium">Manage</Link>
            </>
          )}
          {role === "user" && (
            <Link to="/all-manga" className="text-white hover:text-blue-600 font-medium">Browse</Link>
          )}
        </div>

        <div>
          {role ? (
            <Button onClick={handleLogout} className=" text-white">Logout</Button>
          ) : (
            <Link to="/login">
              <Button className=" text-white">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
