import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Lock, Envelope, User as UserIcon, ArrowRight, WarningCircle, Check } from '@phosphor-icons/react';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'learner' | 'mentor' | 'admin'>('learner');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'mentor') navigate('/mentor');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await register({ name, email, password, role });
      } else {
        await login({ email, password });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPass });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-premium p-8"
      >
        {/* Header & Mode Switcher */}
        <div className="text-center mb-6">
          <div className="inline-flex w-10 h-10 rounded-xl bg-navy text-actionBlue items-center justify-center font-heading font-bold text-lg mb-3">
            SB
          </div>
          <h2 className="text-2xl font-heading font-bold text-navy">
            {mode === 'signup' ? 'Create your account' : 'Welcome back to SkillBridge'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'signup'
              ? 'Start practising real-world tasks and building your portfolio.'
              : 'Log in to continue your challenge progress and view feedback.'}
          </p>

          <div className="flex bg-slate-100 p-1 rounded-xl mt-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <WarningCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Envelope size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="learner@skillbridge.dev"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-actionBlue focus:ring-1 focus:ring-actionBlue capitalize"
              >
                <option value="learner">Learner (Practise tasks & build portfolio)</option>
                <option value="mentor">Mentor (Review assessments & evaluate)</option>
                <option value="admin">Administrator (System configuration)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-actionBlue hover:bg-actionBlue-dark text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Log In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick One-Click Demo Logins
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('learner@skillbridge.dev', 'Learner123!')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-blue-50 hover:text-actionBlue text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
            >
              Learner
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('mentor@skillbridge.dev', 'Mentor123!')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-orange-50 hover:text-highlightOrange text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
            >
              Mentor
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@skillbridge.dev', 'Admin123!')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-navy-50 hover:text-navy text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
