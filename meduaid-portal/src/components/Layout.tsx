import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Only show relevant links
  let navLinks = user && !user.isAdmin
    ? [
        { to: '/', label: 'Dashboard' },
        { to: '/submit-question', label: 'Submit Question' },
        { to: '/edit-rejected', label: 'Edit Rejected Questions' },
      ]
    : [
        { to: '/', label: 'Dashboard' },
      ];

  // Add admin-only links
  if (user && user.isAdmin) {
    navLinks = [
      { to: '/', label: 'Dashboard' },
      { to: '/admin/penalties', label: 'Penalties Management' },
      { to: '/admin/review', label: 'Question Review' },
    ];
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-accent-light font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-primary text-white px-8 py-4 flex items-center justify-between shadow-md w-full">
        <div className="flex items-center gap-3 w-full">
          <div className="text-2xl font-bold tracking-wide">MeduAid</div>
          <ul className="flex gap-8 ml-8 text-lg font-medium w-full">
            {navLinks.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'font-bold underline text-white'
                      : 'text-white hover:underline hover:text-white/90'
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="font-semibold">{user.isAdmin ? 'Admin' : user.email}</span>
              <img src={`https://ui-avatars.com/api/?name=${user.isAdmin ? 'Admin' : user.email}`} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white" />
              <button
                onClick={handleLogout}
                className="ml-2 bg-white text-primary px-3 py-1 rounded hover:bg-accent-light font-semibold transition"
              >
                Logout
              </button>
              {user && !user.isAdmin && (
                <a href="/settings" className="ml-4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition">Settings</a>
              )}
              {user && user.isAdmin && (
                <a href="/admin/all-submissions" className="ml-4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition">All Submissions</a>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className="font-semibold hover:underline text-white">Login</NavLink>
              <NavLink to="/signup" className="font-semibold hover:underline text-white">Sign Up</NavLink>
            </>
          )}
        </div>
      </nav>
      <main className="flex-1 w-full">
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 