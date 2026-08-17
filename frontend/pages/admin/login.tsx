import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ShieldAlert, User, Lock, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function AdminLogin() {
  const router = useRouter();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setIsProcessing(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/admin/login`, {
        username: username.trim(),
        password: password.trim(),
      });

      if (response.data.token) {
        // Save Admin JWT session
        localStorage.setItem('attendx_admin_token', response.data.token);
        localStorage.setItem('attendx_admin_username', response.data.username);
        
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or connection issue.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Home portal
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">HR Admin Login</h2>
            <p className="text-slate-400 text-xs mt-1">
              Authenticate to manage employees & settings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 mt-4 text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Logging In...
                </>
              ) : (
                'Secure Sign In'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
