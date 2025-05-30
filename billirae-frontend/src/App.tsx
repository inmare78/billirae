import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './lib/theme-provider'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import CreateInvoicePage from './pages/CreateInvoicePage'
import ProfilePage from './pages/Profile'
import IncomeDashboardPage from './pages/dashboard/IncomeDashboardPage'
import AuthGuard from './components/auth/AuthGuard'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="billirae-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/create-invoice" element={
                <AuthGuard>
                  <CreateInvoicePage />
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <ProfilePage />
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <IncomeDashboardPage />
                </AuthGuard>
              } />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
