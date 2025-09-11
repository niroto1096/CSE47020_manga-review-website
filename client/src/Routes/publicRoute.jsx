import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";

const PublicRoute = ({ children }) => {
  const { role } = useContext(UserContext);
  const storedRole = localStorage.getItem('role');

  // jodi login thake tahole dashboard ba homepage e redirect korbo
  if (role || storedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;