import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Placeholder Dashboard component
const Dashboard = () => (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
    <p>Hier siehst du später deine Rechnungen.</p>
  </div>
);

// Placeholder Home component
const Home = () => (
  <div className="container mx-auto p-4 text-center">
    <h1 className="text-3xl font-bold mb-4">Willkommen bei Billirae</h1>
    <p className="mb-4">Deine Rechnungsapp ist bereit!</p>
    <div className="flex justify-center gap-4">
      <a href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Anmelden
      </a>
      <a href="/register" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
        Registrieren
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={
              <AuthGuard requireAuth={false}>
                <LoginPage />
              </AuthGuard>
            } 
          />
          <Route 
            path="/register" 
            element={
              <AuthGuard requireAuth={false}>
                <RegisterPage />
              </AuthGuard>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
