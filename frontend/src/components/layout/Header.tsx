import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Shield, Briefcase, Bot } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = (r?: string | null) => {
    if (r === 'recruiter') return 'brand';
    if (r === 'admin') return 'purple';
    return 'info';
  };

  return (
    <header className="h-16 border-b border-surface-800 bg-surface-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-white">CALYX</span>
            <span className="text-[10px] uppercase tracking-widest text-brand-400 block -mt-1 font-mono">
              Agentic AI Mesh
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation & User actions */}
      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div>
                <span className="text-xs font-semibold text-white block">{user.full_name}</span>
                <span className="text-[10px] text-surface-400 block font-mono">{user.email}</span>
              </div>
              <Badge variant={getRoleBadgeVariant(role) as any} size="sm">
                {user.role.toUpperCase()}
              </Badge>
            </div>

            <Link
              to="/profile"
              className="p-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
              title="Profile & Session"
            >
              <UserIcon className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-surface-800 hover:bg-rose-950/60 text-surface-300 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-surface-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
