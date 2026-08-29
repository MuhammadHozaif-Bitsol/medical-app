
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginForm } from './features/auth/LoginForm';
import { PatientPortal } from './pages/PatientPortal';
import { StaffDashboard } from './pages/StaffDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/login" element={
              <div className="flex-center min-h-[80vh]">
                <LoginForm />
              </div>
            } />

            {/* Protected Routes: Patient */}
            <Route path="/patient/*" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientPortal />
              </ProtectedRoute>
            } />

            {/* Protected Routes: Staff */}
            <Route path="/staff/*" element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            } />

            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
