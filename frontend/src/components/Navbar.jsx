import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Camera, Home, Map, Activity, ShieldAlert, LogIn, LogOut, User, Menu, X, FileText, Shield, User as UserIcon, Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationAsRead } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, userData, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
       console.error("Failed to mark as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error(err);
    }
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  const navLinkClass = ({ isActive }) =>
    `flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all ${
      isActive ? 'bg-sky-500/20 text-sky-400' : 'text-[var(--color-text-secondary)] hover:text-sky-400 hover:bg-white/5'
    }`;

  return (
    <nav className="absolute top-4 w-full z-50 bg-transparent px-[var(--spacing-4)] py-[var(--spacing-3)] transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2" onClick={closeMobile}>
          <span className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] hidden sm:block">
            Smart Civic Reporter
          </span>
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-2 items-center">
          <NavLink to="/" end className={navLinkClass}>
            <Home className="w-4 h-4" />
            <span className="font-medium">Home</span>
          </NavLink>

          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <Map className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
          )}

          {user && (
            <NavLink to="/my-complaints" className={navLinkClass}>
              <FileText className="w-4 h-4" />
              <span className="font-medium">My Complaints</span>
            </NavLink>
          )}

          {isAdmin && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="font-medium">Admin</span>
              </NavLink>
            </>
          )}

          {user && !isAdmin && (
            <NavLink
              to="/submit"
              onClick={(e) => {
                if (window.location.pathname === '/submit') {
                  e.preventDefault();
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-xs)] transition-[var(--animate-fast)] bg-[var(--color-surface-muted)] text-[var(--color-text-inverse)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-surface-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)] hover:-translate-y-0.5"
            >
              <Camera className="w-4 h-4" />
              <span className="font-medium">Report Issue</span>
            </NavLink>
          )}

          <div className="w-px h-6 bg-slate-300 mx-1" />

          {user ? (
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#0f172a]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 glass-panel border border-white/10 shadow-2xl rounded-2xl overflow-hidden py-2 z-50 origin-top-right"
                    >
                      <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-white">Notifications</h3>
                        <span className="text-xs text-gray-400">{unreadCount} New</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto w-full custom-scrollbar">
                        {notifications.length === 0 ? (
                           <div className="p-6 text-center text-gray-500 text-sm">No new notifications</div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {notifications.map(n => (
                              <div key={n.id} className={`p-4 flex gap-3 hover:bg-white/5 transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}>
                                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                  <p className={`text-sm ${!n.read ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>{n.message}</p>
                                  <p className="text-[10px] text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                                {!n.read && (
                                  <button onClick={() => handleRead(n.id)} className="p-1.5 text-gray-400 hover:text-green-400 self-start hover:bg-white/10 rounded-lg">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Go to Dashboard"
              >
                <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {(userData?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm">
                  {userData?.name || 'User'}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <NavLink
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <LogIn className="w-4 h-4" />
                <span className="font-medium">Login</span>
              </NavLink>
              <NavLink
                to="/signup"
                className="flex items-center space-x-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-xs)] transition-[var(--animate-fast)] bg-[var(--color-surface-muted)] text-[var(--color-text-inverse)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-surface-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]"
              >
                <User className="w-4 h-4" />
                <span>Sign Up</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 border-t border-white/10 pt-4 space-y-2"
          >
            <NavLink to="/" end className={navLinkClass} onClick={closeMobile}>
              <Home className="w-4 h-4" /><span>Home</span>
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={navLinkClass} onClick={closeMobile}>
                <Map className="w-4 h-4" /><span>Dashboard</span>
              </NavLink>
            )}
            {user && !isAdmin && (
              <NavLink 
                to="/submit" 
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                onClick={(e) => {
                  if (window.location.pathname === '/submit') {
                    e.preventDefault();
                    window.location.reload();
                  }
                  closeMobile();
                }}
              >
                <Camera className="w-4 h-4" /><span>Report Issue</span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/my-complaints" className={navLinkClass} onClick={closeMobile}>
                <FileText className="w-4 h-4" /><span>My Complaints</span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass} onClick={closeMobile}>
                <ShieldAlert className="w-4 h-4" /><span>Admin</span>
              </NavLink>
            )}
            <div className="border-t border-white/10 pt-3 mt-3">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 px-3 py-2 text-gray-300">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {(userData?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-white leading-tight">{userData?.name || 'User'}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                        userData?.role === 'admin' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {userData?.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <UserIcon className="w-2.5 h-2.5" />}
                        <span>{userData?.role === 'admin' ? 'Admin' : 'Citizen'}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all w-full"
                  >
                    <LogOut className="w-4 h-4" /><span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <NavLink to="/login" className={navLinkClass} onClick={closeMobile}>
                    <LogIn className="w-4 h-4" /><span>Login</span>
                  </NavLink>
                  <NavLink to="/signup" className={navLinkClass} onClick={closeMobile}>
                    <User className="w-4 h-4" /><span>Sign Up</span>
                  </NavLink>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
