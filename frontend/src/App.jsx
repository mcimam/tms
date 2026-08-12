import { Navigate, Route, Routes } from "react-router-dom";

import { defaultRouteForRole, ProtectedRoute } from "./auth/ProtectedRoute.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { Layout } from "./components/Layout.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DriverMobilePage from "./pages/DriverMobilePage.jsx";
import DriversPage from "./pages/DriversPage.jsx";
import LiveMonitorPage from "./pages/LiveMonitorPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import ReportingPage from "./pages/ReportingPage.jsx";
import TrucksPage from "./pages/TrucksPage.jsx";

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? defaultRouteForRole(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={["driver"]}>
            <DriverMobilePage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/live-monitor" element={<LiveMonitorPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/trucks" element={<TrucksPage />} />
        <Route path="/reporting" element={<ReportingPage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
