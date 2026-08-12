import { Navigate } from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";

export function defaultRouteForRole(role) {
  return role === "driver" ? "/driver" : "/dashboard";
}

export function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Memuat…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return children;
}
