import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import OtpPage from '@/pages/auth/OtpPage'
import PasswordRecoveryPage from '@/pages/auth/PasswordRecoveryPage'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import SurveysPage from '@/pages/surveys/SurveysPage'
import SurveyDetailPage from '@/pages/surveys/SurveyDetailPage'
import ResponsesPage from '@/pages/surveys/ResponsesPage'
import QuestionLibraryPage from '@/pages/questions/QuestionLibraryPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/otp', element: <OtpPage /> },
  { path: '/password-recovery', element: <PasswordRecoveryPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/surveys', element: <SurveysPage /> },
          { path: '/surveys/:id', element: <SurveyDetailPage /> },
          { path: '/surveys/:id/responses', element: <ResponsesPage /> },
          { path: '/questions', element: <QuestionLibraryPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/surveys" replace /> },
])
