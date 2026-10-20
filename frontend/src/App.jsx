import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
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
import AIChatbot from './components/AIChatbot';

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
          element={
            <ProtectedRoute>
              <MyComplaints />
            </ProtectedRoute>
          }
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
      <AuthProvider>
        <SmoothScroll>
          <div className="relative min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans selection:bg-sky-500/30 overflow-x-hidden">
            
            <Navbar />
            <AIChatbot />
            
            <main className="relative z-10 w-full h-full">
              <AnimatedRoutes />
            </main>
          </div>
        </SmoothScroll>
      </AuthProvider>
    </Router>
  );
}

export default App;
