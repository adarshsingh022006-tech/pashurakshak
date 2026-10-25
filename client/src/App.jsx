import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OfflineProvider } from './context/OfflineContext';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import FarmerDashboard from './pages/FarmerDashboard';
import ReportAnimalHealth from './pages/ReportAnimalHealth';
import AddAnimal from './pages/AddAnimal';
import ReportMortality from './pages/ReportMortality';
import CaseDetail from './pages/CaseDetail';
import HealthRecords from './pages/HealthRecords';
import OutbreakMapPage from './pages/OutbreakMapPage';
import AlertsPage from './pages/AlertsPage';
import VetPriorityQueue from './pages/VetPriorityQueue';
import VetManageCases from './pages/VetManageCases';
import VetScheduleVisits from './pages/VetScheduleVisits';
import AuthorityDashboard from './pages/AuthorityDashboard';
import NearbyVetsPage from './pages/NearbyVetsPage';
import AmbulanceTrackerPage from './pages/AmbulanceTrackerPage';

// Route Guard component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Checking credentials...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this specific role route, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <OfflineProvider>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Main App Layout */}
              <Route element={<Layout />}>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FarmerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <ProtectedRoute>
                      <ReportAnimalHealth />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-animal"
                  element={
                    <ProtectedRoute>
                      <AddAnimal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report-mortality"
                  element={
                    <ProtectedRoute>
                      <ReportMortality />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/case/:id"
                  element={
                    <ProtectedRoute>
                      <CaseDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/records"
                  element={
                    <ProtectedRoute>
                      <HealthRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <OutbreakMapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <AlertsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/nearby-vets"
                  element={
                    <ProtectedRoute>
                      <NearbyVetsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ambulance"
                  element={
                    <ProtectedRoute>
                      <AmbulanceTrackerPage />
                    </ProtectedRoute>
                  }
                />

                {/* Veterinarian Routes */}
                <Route
                  path="/vet/priority"
                  element={
                    <ProtectedRoute allowedRoles={['vet', 'authority', 'farmer']}>
                      <VetPriorityQueue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vet/cases"
                  element={
                    <ProtectedRoute allowedRoles={['vet', 'authority', 'farmer']}>
                      <VetManageCases />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vet/visits"
                  element={
                    <ProtectedRoute allowedRoles={['vet', 'authority', 'farmer']}>
                      <VetScheduleVisits />
                    </ProtectedRoute>
                  }
                />

                {/* Government Authority Routes */}
                <Route
                  path="/authority"
                  element={
                    <ProtectedRoute allowedRoles={['authority', 'vet']}>
                      <AuthorityDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </OfflineProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
