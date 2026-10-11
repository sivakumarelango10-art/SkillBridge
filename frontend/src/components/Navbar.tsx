import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  FileText,
  ClockCounterClockwise,
  Briefcase,
  UserCheck,
  Gear,
  SignOut,
  List,
  X,
  Sparkle,
} from '@phosphor-icons/react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <span className="font-heading font-bold text-lg text-actionBlue">S</span>
            <span className="font-heading font-bold text-lg text-highlightOrange -ml-1">B</span>
          </div>
          <span className="font-heading font-bold text-xl text-navy tracking-tight">
            Skill<span className="text-actionBlue">Bridge</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-navy-50 text-navy font-semibold' : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/challenge"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/challenge') ? 'bg-navy-50 text-navy font-semibold' : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                }`}
              >
                Challenge
              </Link>
              <Link
                to="/history"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/history') ? 'bg-navy-50 text-navy font-semibold' : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                }`}
              >
                Version History
              </Link>
              <Link
                to="/portfolio"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/portfolio') ? 'bg-navy-50 text-navy font-semibold' : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                }`}
              >
                Portfolio
              </Link>

              {(user.role === 'mentor' || user.role === 'admin') && (
                <Link
                  to="/mentor"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/mentor') ? 'bg-highlightOrange/10 text-highlightOrange font-semibold' : 'text-slate-600 hover:text-highlightOrange hover:bg-orange-50'
                  }`}
                >
                  <UserCheck size={16} />
                  Mentor Queue
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/admin') ? 'bg-navy/10 text-navy font-semibold' : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                  }`}
                >
                  <Gear size={16} />
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <a
                href="#how-it-works"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-navy hover:bg-slate-50 transition-colors"
              >
                How It Works
              </a>
              <Link
                to="/challenge"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-navy hover:bg-slate-50 transition-colors"
              >
                The Challenge
              </Link>
              <a
                href="#pilot"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-navy hover:bg-slate-50 transition-colors"
              >
                Pilots for Colleges
              </a>
            </>
          )}
        </nav>

        {/* User CTA or Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-semibold text-navy leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider capitalize font-mono">
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
              >
                <SignOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/auth?mode=login"
                className="px-3.5 py-1.5 text-sm font-medium text-navy hover:text-actionBlue transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-actionBlue hover:bg-actionBlue-dark rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98]"
              >
                Start Practice Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-navy rounded-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2"
          >
            {user ? (
              <>
                <div className="py-2 border-b border-slate-100 mb-2">
                  <div className="text-sm font-bold text-navy">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email} · {user.role}</div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/challenge"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  The Challenge
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Version History
                </Link>
                <Link
                  to="/portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Portfolio
                </Link>
                {(user.role === 'mentor' || user.role === 'admin') && (
                  <Link
                    to="/mentor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-highlightOrange hover:bg-orange-50"
                  >
                    Mentor Queue
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2 text-center text-sm font-medium text-navy border border-slate-300 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2 text-center text-sm font-semibold text-white bg-actionBlue rounded-lg"
                >
                  Start Practice Free
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
