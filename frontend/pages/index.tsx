import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Award, ArrowRight, Loader2, Phone } from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  const router = useRouter();
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${backendUrl}/api/auth/verify-entry`, {
        input: inputVal.trim(),
      });

      if (res.data.type === 'ADMIN') {
        localStorage.setItem('attendx_admin_token', res.data.token);
        localStorage.setItem('attendx_admin_username', res.data.username);
        router.push('/admin/dashboard');
      } else if (res.data.type === 'EMPLOYEE') {
        localStorage.setItem('attendx_verify_employee_id', res.data.employeeId);
        localStorage.setItem('attendx_verify_name', res.data.name);
        localStorage.setItem('attendx_verify_phone', res.data.phone);
        router.push('/user/login');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Employee not found.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors flex flex-col items-center justify-center p-4">
      {/* Theme Switcher Header */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center text-center">
        {/* Brand header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-3"
        >
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
            Attend<span className="text-blue-500">X</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-slate-400 text-xs md:text-sm font-medium mb-8 uppercase tracking-widest"
        >
          NSM & Associates Attendance Portal
        </motion.h1>

        {/* Single Unified Login Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card w-full rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center border border-slate-800 dark:border-slate-800 light:border-slate-200"
        >
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-xs mb-6 max-w-xs">
            Enter your mobile number to begin attendance verification.
          </p>

          <form onSubmit={handleContinue} className="w-full flex flex-col gap-4">
            <div className="relative w-full">
              <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter Mobile Number"
                className="w-full bg-slate-900/90 dark:bg-slate-900/90 light:bg-white text-white dark:text-white light:text-slate-900 placeholder-slate-500 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-semibold text-left px-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-xs text-slate-500">
            First time employee?{' '}
            <span
              onClick={() => router.push('/user/register')}
              className="text-blue-500 hover:underline cursor-pointer font-semibold"
            >
              Register here
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-xs text-slate-500 font-medium"
        >
          AttendX SaaS HRMS • NSM & Associates
        </motion.div>
      </div>
    </div>
  );
}
