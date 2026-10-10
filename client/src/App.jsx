import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './layouts/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import BrowseLaundries from './pages/BrowseLaundries';
import LaundryDetails from './pages/LaundryDetails';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import BookOrder from './pages/customer/BookOrder';
import OrderTracking from './pages/customer/OrderTracking';
import OrderHistory from './pages/customer/OrderHistory';

// Partner Pages
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerIntake from './pages/partner/PartnerIntake';
import PartnerServices from './pages/partner/PartnerServices';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPartners from './pages/admin/AdminPartners';
import AdminCommissions from './pages/admin/AdminCommissions';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDisputes from './pages/admin/AdminDisputes';

function NotFound() {
  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        The page you are looking for does not exist in the Kano Laundry Platform.
      </p>
      <a href="/" className="btn btn-primary">Return to Home</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Pages */}
            <Route index element={<Home />} />
            <Route path="browse" element={<BrowseLaundries />} />
            <Route path="laundries/:id" element={<LaundryDetails />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Customer Routes (Protected for Customer & Admin) */}
            <Route
              path="customer"
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="customer/book"
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <BookOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="customer/orders"
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin']}>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="customer/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['customer', 'partner', 'admin']}>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />

            {/* Partner Routes (Protected for Partner & Admin) */}
            <Route
              path="partner"
              element={
                <ProtectedRoute allowedRoles={['partner', 'admin']}>
                  <PartnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="partner/orders/:id/intake"
              element={
                <ProtectedRoute allowedRoles={['partner', 'admin']}>
                  <PartnerIntake />
                </ProtectedRoute>
              }
            />
            <Route
              path="partner/services"
              element={
                <ProtectedRoute allowedRoles={['partner', 'admin']}>
                  <PartnerServices />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes (Strictly Admin Only) */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/partners"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPartners />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/commissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCommissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/disputes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDisputes />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
