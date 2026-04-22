import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicOnlyRoute from "../components/auth/PublicOnlyRoute";
import DashboardHome from "../pages/DashboardHome";
import CategoryManagement from "../pages/CategoryManagement";
import TableManagement from "../pages/TableManagement";
import QRCodeGeneration from "../pages/QRCodeGeneration";
import Inventory from "../pages/Inventory";
import Payments from "../pages/Payments";
import LiveOrders from "../pages/LiveOrders";
import DashboardLayout from "../layout/DashboardLayout";
import ProfilePage from "../pages/ProfilePage";
import Register from "@/pages/Register";
import NewReservation from "@/pages/NewReservation";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Protected dashboard — layout wraps all app pages */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"          element={<DashboardHome />} />
          <Route path="/category"  element={<CategoryManagement />} />
          <Route path="/tables"    element={<TableManagement />} />
          <Route path="/qr-code"   element={<QRCodeGeneration />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/payments"  element={<Payments />} />
          <Route path="/orders"    element={<LiveOrders />} />
          <Route path="/profile"   element={<ProfilePage />} />
          <Route path="/reservation" element={<NewReservation />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}