import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './routes/ProtectedRoute'
import QuestionSubmission from './pages/QuestionSubmission'
import EditQuestions from './pages/EditQuestions'
import PenaltiesManagement from './pages/PenaltiesManagement'
import QuestionReview from './pages/QuestionReview'
import AllSubmissions from './pages/AllSubmissions'
import Settings from './pages/Settings'
import AllAdminSubmissions from './pages/AllAdminSubmissions'
import AdminQuestionSubmission from './pages/AdminQuestionSubmission'
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useAuth } from './context/AuthContext'

function App() {
  const { loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-2xl text-primary">Loading...</div>;
  }
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          {/* Protected Writer Routes */}
          <Route element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="submit-question" element={<QuestionSubmission />} />
            <Route path="edit-questions" element={<EditQuestions />} />
          </Route>
          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute adminOnly={true} />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/penalties" element={<PenaltiesManagement />} />
            <Route path="admin/review" element={<QuestionReview />} />
            <Route path="admin/all-submissions" element={<AllAdminSubmissions />} />
            <Route path="admin/submit-question" element={<AdminQuestionSubmission />} />
          </Route>
          {/* All Submissions Route */}
          <Route path="all-submissions" element={<AllSubmissions />} />
          {/* Settings Route */}
          <Route path="settings" element={<Settings />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
