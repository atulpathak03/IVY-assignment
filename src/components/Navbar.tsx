import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Heart, Key, BarChart3, Home, KeyRound, LogOut, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Building2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' }}>Ivy Homes</span>
            <span style={{ fontSize: '0.7rem', display: 'block', color: '#10b981', fontWeight: 600, marginTop: '-3px' }}>Chennai Property API</span>
          </div>
        </NavLink>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAuthenticated && (
            <>
              <NavLink to="/listings" className={({ isActive }) => `btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem' }}>
                <Home size={16} /> Listings
              </NavLink>
              <NavLink to="/favourites" className={({ isActive }) => `btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem' }}>
                <Heart size={16} color="#f43f5e" /> Saved
              </NavLink>
              <NavLink to="/rentals" className={({ isActive }) => `btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem' }}>
                <Key size={16} /> Rentals
              </NavLink>
              <NavLink to="/projects" className={({ isActive }) => `btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem' }}>
                <Building2 size={16} /> Projects
              </NavLink>
              <NavLink to="/insights" className={({ isActive }) => `btn-secondary ${isActive ? 'active-nav' : ''}`} style={{ padding: '0.5rem 0.9rem', fontSize: '0.88rem', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)' }}>
                <BarChart3 size={16} color="#10b981" /> Insights & Findings
              </NavLink>
            </>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: '#f8fafc' }}>{user?.name || user?.email}</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Demo Account</span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }} title="Log out">
                <LogOut size={18} color="#94a3b8" />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
              <KeyRound size={16} /> Log In
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};
