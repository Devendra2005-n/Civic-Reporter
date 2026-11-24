import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Submit from './pages/Submit';
import Dashboard from './pages/Dashboard';
import Details from './pages/Details';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyComplaints from './pages/MyComplaints';
import AuthorityLogin from './pages/authority/Login';
import AuthorityDashboard from './pages/authority/Dashboard';
import AuthorityComplaintDetail from './pages/authority/ComplaintDetail';
// FAB removed — report buttons already exist in Navbar and Dashboard
import SmoothScroll from './components/SmoothScroll';

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/details/:id" element={<Details />} />
        <Route
          path="/submit"
          element={
            <ProtectedRoute>
              <Submit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-complaints"
          element={<Navigate to="/dashboard?tab=my" replace />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="/authority/login" element={<AuthorityLogin />} />
        <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
        <Route path="/authority/complaint/:id" element={<AuthorityComplaintDetail />} />
      </Routes>
    </AnimatePresence>
  );
};

// BackgroundEffects replaced by EnhancedBackground component

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <SmoothScroll>
            <div className="relative min-h-screen bg-[#F9FAFB] text-[#334155] font-sans selection:bg-[#E0F2FE] selection:text-[#0284C7] overflow-x-hidden">
              
              <Navbar />
              
              <main className="relative z-10 w-full h-full">
                <AnimatedRoutes />
              </main>
            </div>
          </SmoothScroll>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
