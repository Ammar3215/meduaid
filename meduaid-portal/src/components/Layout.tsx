import React, { useRef, useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

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
      {/* Top Navigation Bar (hidden on mobile) */}
      {location.pathname !== '/login' && location.pathname !== '/signup' && (
        <>
          <nav className="hidden md:flex items-stretch w-full shadow-md bg-white text-primary">
            {/* Brand Section */}
            <div className="flex items-center px-8 py-4 bg-white text-primary min-w-[220px]">
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
                          : 'text-primary hover:bg-gray-100 hover:text-primary')
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
          {/* Hamburger for mobile (left side) */}
          <div className="flex items-center md:hidden w-full shadow-md bg-white text-primary h-14 px-4">
            <button
              className="mr-3 focus:outline-none group flex items-center justify-center bg-transparent"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: 'transparent' }}
            >
              {/* Clean Hamburger icon, no background at all */}
              <svg className="w-7 h-7 text-primary transition group-hover:opacity-70 group-hover:scale-105" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img src="/meduaid-logo.svg" alt="MeduAid Logo" className="h-8 w-auto" />
          </div>
          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 flex">
              {/* Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
              {/* Drawer */}
              <div ref={mobileMenuRef} className="relative bg-white w-64 max-w-full h-full shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
                <div className="flex items-center justify-between px-4 py-4 border-b">
                  <span className="font-bold text-primary text-lg">Menu</span>
                  <button className="text-gray-500 hover:text-primary" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ul className="flex flex-col gap-1 mt-4 px-4">
                  {navLinks.map(link => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        className={({ isActive }) =>
                          `block px-4 py-3 rounded-lg font-semibold text-base transition ` +
                          (isActive ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-blue-100')
                        }
                        end={link.to === '/'}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 px-4 border-t pt-4">
                  {user ? (
                    <>
                      {user && !user.isAdmin && (
                        <NavLink to="/settings" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded" onClick={() => setMobileMenuOpen(false)}>
                          Settings
                        </NavLink>
                      )}
                      <button
                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded mt-2"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <NavLink to="/login" className="block px-4 py-2 text-primary hover:bg-blue-50 rounded" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </NavLink>
                      <NavLink to="/signup" className="block px-4 py-2 text-primary hover:bg-blue-50 rounded" onClick={() => setMobileMenuOpen(false)}>
                        Sign Up
                      </NavLink>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
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