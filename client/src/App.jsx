

import Registration from "./Pages/registration";
import Otp from "./Pages/otp";
import Login from "./Pages/login"; // fix import: use your custom Login component

import { Route, Routes } from "react-router-dom";
import UserProvider from "./Context/UserContext";
import ProtectedRoute from "./Routes/protectedRoute";




import Unauthorized from "./Pages/Unauthorized";
import Navbar from "./Pages/Navbar";
import Home from "./Pages/Home";

import AllManga from "./Pages/AllManga";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import UserMovies from "./Pages/userManga";
import Details from "./Pages/details";
import UploadManga from "./Pages/uploadManga";
import UserManga from "./Pages/userManga";



function App() {
  return (
    <UserProvider>
      <Navbar/>
      <Routes>
        
        <Route path="/registration" element={<Registration />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Home/>}/>
        


        <Route
          path="/upload"
          element={
            <ProtectedRoute role={["admin"]}>
              <UploadManga/>
            </ProtectedRoute>
          }
        />

      <Route
          path="/admin-manga"
          element={
            <ProtectedRoute role={["admin"]}>
              <AllManga/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/all-manga"
          element={
            <ProtectedRoute role={["user"]}>
              <UserManga/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/manga-detail/:id"
          element={
            <ProtectedRoute role={["user"]}>
              <Details/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </UserProvider>
  );
}

export default App;
