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
          <div className="flex items-center justify-between md:hidden w-full shadow-md bg-white text-primary h-14 px-4">
            <div className="flex items-center">
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
            {/* User info on mobile header */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">{user.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-primary font-bold">
                    {user.isAdmin ? 'ADMIN' : 'USER'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 flex">
              {/* Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
              {/* Drawer */}
              <div ref={mobileMenuRef} className="relative bg-white w-80 max-w-full h-full shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
                {/* Header with user info */}
                <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-xl">Menu</span>
                    <button 
                      className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition" 
                      aria-label="Close menu" 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {user ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-lg font-bold border-2 border-white border-opacity-30">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg truncate">{user.name || 'User'}</div>
                        <div className="text-sm text-white text-opacity-90 truncate">{user.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-20 font-medium">
                            {user.isAdmin ? 'Administrator' : 'Writer'}
                          </span>
                          {user.isVerified && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500 bg-opacity-20 font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-lg font-semibold mb-2">Welcome to MeduAid</div>
                      <div className="text-sm text-white text-opacity-90">Please sign in to continue</div>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-4 py-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                      Navigation
                    </div>
                    <ul className="flex flex-col gap-1">
                      {navLinks.map(link => (
                        <li key={link.to}>
                          <NavLink
                            to={link.to}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition ` +
                              (isActive 
                                ? 'bg-blue-50 text-primary border-l-4 border-primary' 
                                : 'text-gray-700 hover:bg-blue-50 hover:text-primary')
                            }
                            end={link.to === '/'}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {/* Icons for each navigation item */}
                            {link.to === '/' && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            )}
                            {link.to.includes('submissions') && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {link.to.includes('submit') && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                            {link.to.includes('edit') && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                            {link.to.includes('penalties') && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            )}
                            {link.to.includes('review') && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            )}
                            {link.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* User Actions */}
                  {user && (
                    <div className="px-4 py-4 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                        Account
                      </div>
                      <div className="flex flex-col gap-1">
                        {user && !user.isAdmin && (
                          <NavLink 
                            to="/settings" 
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-primary rounded-lg transition" 
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </NavLink>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-lg transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Guest Actions */}
                  {!user && (
                    <div className="px-4 py-4 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                        Account
                      </div>
                      <div className="flex flex-col gap-1">
                        <NavLink 
                          to="/login" 
                          className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-blue-50 rounded-lg transition" 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Login
                        </NavLink>
                        <NavLink 
                          to="/signup" 
                          className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-blue-50 rounded-lg transition" 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Sign Up
                        </NavLink>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="text-center text-xs text-gray-500">
                    <div className="font-medium mb-1">MeduAid QB Portal</div>
                    <div>Version 1.0.0</div>
                  </div>
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