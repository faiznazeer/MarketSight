import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import MainApp from '@/pages/MainApp'
import Callback from '@/pages/Callback'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  
  if (user) {
    return <Navigate to="/app" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
