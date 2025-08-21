import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../Context/userContext";

const PublicRoute = ({ children }) => {
  const { role } = useContext(UserContext);

  // jodi login thake tahole dashboard ba homepage e redirect korbo
  if (role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;