import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './lib/theme-provider'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import CreateInvoicePage from './pages/CreateInvoicePage'
import ProfilePage from './pages/ProfilePage'
import IncomeDashboardPage from './pages/dashboard/IncomeDashboardPage'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="billirae-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/create-invoice" element={<CreateInvoicePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard" element={<IncomeDashboardPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
