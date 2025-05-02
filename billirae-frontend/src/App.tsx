import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/create-invoice" element={<CreateInvoicePage />} />
          <Route path="*" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">404 - Seite nicht gefunden</h1></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
