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
    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive 
        ? 'bg-[#F0F9FF] text-[#0284C7] font-semibold' 
        : 'text-[#334155] hover:text-[#0284C7] hover:bg-[#F8FAFC] font-medium'
    }`;

  return (
    <nav className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2.5" onClick={closeMobile}>
          <div className="w-9 h-9 rounded-lg bg-[#0284C7] flex items-center justify-center text-white shadow-xs">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#0F172A] leading-tight">
              Civic Reporter
            </span>
            <span className="text-[11px] font-medium text-[#6B7280]">
              Citizen Portal
            </span>
          </div>
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex space-x-1.5 items-center">
          <NavLink to="/" end className={navLinkClass}>
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>

          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              <Map className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
          )}

          {user && (
            <NavLink to="/my-complaints" className={navLinkClass}>
              <FileText className="w-4 h-4" />
              <span>My Complaints</span>
            </NavLink>
          )}

          {isAdmin && (
            <>
              <div className="w-px h-5 bg-[#E5E7EB] mx-1" />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                      : 'text-[#334155] hover:text-rose-600 hover:bg-rose-50/50 font-medium'
                  }`
                }
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
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
              className="flex items-center space-x-1.5 ml-2 px-3.5 py-2 rounded-lg transition-colors bg-[#0284C7] text-white hover:bg-[#0369A1] shadow-xs text-sm font-semibold"
            >
              <Camera className="w-4 h-4" />
              <span>Report Issue</span>
            </NavLink>
          )}

          <div className="w-px h-5 bg-[#E5E7EB] mx-1.5" />

          {user ? (
            <div className="flex items-center space-x-2">
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-[#6B7280] hover:text-[#0F172A] hover:bg-[#F3F4F6] transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#0284C7] text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-[#E5E7EB] shadow-xl rounded-xl overflow-hidden py-1 z-50 origin-top-right"
                    >
                      <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F9FAFB] flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-[#0F172A]">Notifications</h3>
                        <span className="text-xs font-medium text-[#0284C7] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BAE6FD]">
                          {unreadCount} New
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto w-full custom-scrollbar">
                        {notifications.length === 0 ? (
                           <div className="p-6 text-center text-[#9CA3AF] text-sm">No new notifications</div>
                        ) : (
                          <div className="divide-y divide-[#F3F4F6]">
                            {notifications.map(n => (
                              <div key={n.id} className={`p-3.5 flex gap-3 hover:bg-[#F9FAFB] transition-colors ${!n.read ? 'bg-[#F0F9FF]/40' : ''}`}>
                                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.read ? 'bg-[#0284C7]' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                  <p className={`text-sm ${!n.read ? 'text-[#0F172A] font-medium' : 'text-[#4B5563]'}`}>{n.message}</p>
                                  <p className="text-[11px] text-[#9CA3AF] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                </div>
                                {!n.read && (
                                  <button onClick={() => handleRead(n.id)} className="p-1 text-[#9CA3AF] hover:text-[#16A34A] self-start hover:bg-emerald-50 rounded-md transition-colors">
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

              {/* User Avatar & Name */}
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-[#334155] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                title="Go to Dashboard"
              >
                <div className="w-7 h-7 bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] rounded-full flex items-center justify-center text-xs font-bold">
                  {(userData?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm text-[#0F172A] max-w-[120px] truncate">
                  {userData?.name || 'User'}
                </span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 transition-colors text-sm font-medium cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <NavLink
                to="/login"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm text-[#334155] hover:text-[#0F172A] hover:bg-[#F3F4F6] transition-colors font-medium"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </NavLink>
              <NavLink
                to="/signup"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm transition-colors bg-[#0284C7] text-white hover:bg-[#0369A1] font-semibold shadow-xs"
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
          className="md:hidden p-2 text-[#334155] hover:text-[#0F172A] hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
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
            className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-3 space-y-1 shadow-md"
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
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#0284C7] text-white font-semibold text-sm shadow-xs"
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

            <div className="border-t border-[#E5E7EB] pt-3 mt-2">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5 px-2 py-1 text-[#334155]">
                    <div className="w-8 h-8 bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] rounded-full flex items-center justify-center text-xs font-bold">
                      {(userData?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-[#0F172A] text-sm leading-tight">{userData?.name || 'User'}</span>
                      <span className={`text-[11px] font-medium flex items-center space-x-1 ${
                        userData?.role === 'admin' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {userData?.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        <span>{userData?.role === 'admin' ? 'Admin' : 'Citizen'}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors w-full cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /><span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <NavLink to="/login" className={navLinkClass} onClick={closeMobile}>
                    <LogIn className="w-4 h-4" /><span>Login</span>
                  </NavLink>
                  <NavLink to="/signup" className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#0284C7] text-white font-semibold text-sm shadow-xs" onClick={closeMobile}>
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
