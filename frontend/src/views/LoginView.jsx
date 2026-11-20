import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, ShieldCheck, Lock, Mail, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('manager@solvrex.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    login(demoEmail, 'password123')
      .then(res => {
        if (onLoginSuccess) onLoginSuccess(res.user);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold mb-4">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Solvrex Private Limited
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Analyst Team KPI Dashboard &bull; Output, Quality & Delivery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/60">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2.5 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@solvrex.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-md shadow-emerald-900/30 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              1-Click Demo Personas (Zero Setup)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@solvrex.com')}
                className="p-2 bg-slate-900 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors group"
              >
                <div className="font-semibold text-emerald-400 group-hover:text-emerald-300 text-[11px]">
                  Vikram Sethi
                </div>
                <div className="text-[10px] text-slate-400">Role: Manager</div>
                <div className="text-[9px] text-slate-500">&rarr; Team View</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rahul@solvrex.com')}
                className="p-2 bg-slate-900 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors group"
              >
                <div className="font-semibold text-blue-400 group-hover:text-blue-300 text-[11px]">
                  Rahul Sharma
                </div>
                <div className="text-[10px] text-slate-400">Role: Analyst</div>
                <div className="text-[9px] text-slate-500">&rarr; Individual View</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('priya@solvrex.com')}
                className="p-2 bg-slate-900 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors group"
              >
                <div className="font-semibold text-purple-400 group-hover:text-purple-300 text-[11px]">
                  Priya Patel
                </div>
                <div className="text-[10px] text-slate-400">Role: Analyst</div>
                <div className="text-[9px] text-slate-500">&rarr; Individual View</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@solvrex.com')}
                className="p-2 bg-slate-900 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors group"
              >
                <div className="font-semibold text-amber-400 group-hover:text-amber-300 text-[11px]">
                  Sanjay Gupta
                </div>
                <div className="text-[10px] text-slate-400">Role: Admin</div>
                <div className="text-[9px] text-slate-500">&rarr; Settings View</div>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-500">
              Free built-in auth &bull; Password: <code className="text-slate-400">password123</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
