import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JobListPage } from './pages/JobListPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { CandidateResumesPage } from './pages/CandidateResumesPage';
import { CandidateApplicationsPage } from './pages/CandidateApplicationsPage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { RecruiterJobsPage } from './pages/RecruiterJobsPage';
import { RecruiterNewJobPage } from './pages/RecruiterNewJobPage';
import { RecruiterPipelinePage } from './pages/RecruiterPipelinePage';
import { RecruiterVectorSearchPage } from './pages/RecruiterVectorSearchPage';
import { RecruiterEvaluationDetailPage } from './pages/RecruiterEvaluationDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Guard
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'candidate' | 'recruiter' | 'admin'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role) && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Index route smart redirection based on role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/jobs" replace />;
  }

  if (role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  return <Navigate to="/candidate/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Application Shell */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<RootRedirect />} />

              {/* Public / Job Discovery */}
              <Route path="/jobs" element={<JobListPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailPage />} />

              {/* Candidate Workspace */}
              <Route
                path="/candidate/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/resumes"
                element={
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <CandidateResumesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/applications"
                element={
                  <ProtectedRoute allowedRoles={['candidate']}>
                    <CandidateApplicationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Recruiter Workspace */}
              <Route
                path="/recruiter/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs/new"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterNewJobPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs/:jobId/pipeline"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterPipelinePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/search"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterVectorSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/evaluate/:applicationId"
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterEvaluationDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Common Account Profile */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Handler */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
