import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('doctor@hospital.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email');
      return;
    }
    login();
  };

  return (
    <div className="min-h-screen bg-[#080D19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle ambient medical glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111B2D] border border-[#1E2D4A] rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-blue-500/20">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">IntelliMed AI</h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent Medication Monitoring and Assistance System
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-[#080D19] border border-[#1E2D4A] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isRegister ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isRegister ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:border-cyan-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1E2D4A]"></div>
          </div>
          <span className="relative px-3 bg-[#111B2D] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Demonstration Mode
          </span>
        </div>

        {/* Quick Demo Access Button */}
        <button
          onClick={() => login()}
          className="w-full py-3 bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-700 hover:brightness-110 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>Quick Demo Login (Instant Presentation Access)</span>
        </button>

        <p className="text-[11px] text-slate-500 text-center mt-4">
          Session operates with real browser camera APIs and local offline persistence.
        </p>
      </div>
    </div>
  );
};
