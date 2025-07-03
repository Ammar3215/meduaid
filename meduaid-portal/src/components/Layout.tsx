import React, { useRef, useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Only show relevant links
  let navLinks = user && !user.isAdmin
    ? [
        { to: '/', label: 'Dashboard' },
        { to: '/all-submissions', label: 'All Submissions' },
        { to: '/submit-question', label: 'Submit Question' },
        { to: '/edit-questions', label: 'Edit Questions' },
      ]
    : [
        { to: '/', label: 'Dashboard' },
      ];

  // Remove Dashboard button on /verify-email
  if (location.pathname === '/verify-email') {
    navLinks = [];
  }

  // Add admin-only links
  if (user && user.isAdmin) {
    navLinks = [
      { to: '/', label: 'Dashboard' },
      { to: '/admin/all-submissions', label: 'All Submissions' },
      { to: '/admin/submit-question', label: 'Submit Question' },
      { to: '/admin/penalties', label: 'Penalties' },
      { to: '/admin/review', label: 'Question Review' },
    ];
    if (location.pathname === '/verify-email') {
      navLinks = [];
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-accent-light font-sans">
      {/* Split Navigation Bar */}
      {location.pathname !== '/login' && location.pathname !== '/signup' && (
        <nav className="flex items-stretch w-full shadow-md">
          {/* Brand Section */}
          <div className="flex items-center px-8 py-4 bg-gradient-to-r from-primary to-accent text-white min-w-[220px]">
            <img src="/meduaid-logo.svg" alt="MeduAid Logo" className="h-10 w-auto" />
          </div>
          {/* Navigation Tabs */}
          <div className="flex-1 bg-white flex items-center px-4">
            <ul className="flex flex-nowrap gap-2 md:gap-4 lg:gap-8 text-lg font-medium whitespace-nowrap">
              {navLinks.map(link => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-t-lg transition font-semibold ` +
                      (isActive
                        ? 'bg-blue-50 text-primary border-b-4 border-primary shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary')
                    }
                    end={link.to === '/'}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
          {/* User Area */}
          <div className="flex items-center gap-4 px-6 bg-white border-l border-gray-100 relative">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-700">{user.isAdmin ? 'Admin' : user.email}</span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-primary font-bold ml-1">{user.isAdmin ? 'ADMIN' : 'USER'}</span>
                {/* Dropdown for logout/settings - trigger on avatar */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="w-8 h-8 rounded-full border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
                    tabIndex={0}
                    aria-label="User menu"
                    onClick={() => setUserMenuOpen(v => !v)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!userMenuRef.current?.contains(document.activeElement)) {
                          setUserMenuOpen(false);
                        }
                      }, 100);
                    }}
                  >
                    <img src="/meduaid-logo.svg" alt="Avatar" className="w-8 h-8 rounded-full" />
                  </button>
                  <div className={`absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-20 transition ${userMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    {user && !user.isAdmin && (
                      <a href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Settings</a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <NavLink to="/login" className="font-semibold text-primary transition px-3 py-1 rounded hover:underline hover:bg-blue-50">Login</NavLink>
                <NavLink to="/signup" className="font-semibold text-primary transition px-3 py-1 rounded hover:underline hover:bg-blue-50">Sign Up</NavLink>
              </div>
            )}
          </div>
        </nav>
      )}
      <main className="flex-1 w-full">
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 