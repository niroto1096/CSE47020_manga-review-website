import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { verifyUser } from "../Api/authApi";
import { UserContext } from "../Context/userContext";

const ProtectedRoute = ({ children, role: requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const { setUserId, setUserName, role, setRole } = useContext(UserContext);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await verifyUser();
        const user = response.data.user;

        setUserId(user.id);
        setUserName(user.name);
        setRole(user.role);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error verifying user:", error);
        setIsAuthenticated(false);
      }
    };

    verify();
  }, [setUserId, setUserName, setRole]);

  // Show loading state until auth check is complete
  if (isAuthenticated === null) return <div>Loading...</div>;

  // If not authenticated or role is empty, redirect to login
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      if (role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;