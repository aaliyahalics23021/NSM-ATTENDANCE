import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle2, AlertTriangle, Clock, Percent, Calendar, 
  MapPin, Eye, Edit2, Trash2, RotateCcw, FileSpreadsheet, Settings, 
  Search, ShieldAlert, LogOut, Loader2, RefreshCw, Key, ShieldCheck,
  ArrowUpDown, Filter
} from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '@/components/ThemeToggle';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Leaflet map needs client-only execution (SSR workaround)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Session timeout duration (10 minutes in ms)
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

export default function AdminDashboard() {
  const router = useRouter();

  // Admin token
  const [token, setToken] = useState('');
  const [adminUser, setAdminUser] = useState('');
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'employees' | 'settings'>('dashboard');

  // Stats Metrics
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingPunchOuts: 0,
    attendancePercentage: 100
  });
  const [weeklyChart, setWeeklyChart] = useState<any[]>([]);

  // Logs list & Edit Modal
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [editInTime, setEditInTime] = useState('');
  const [editOutTime, setEditOutTime] = useState('');
  const [editStatus, setEditStatus] = useState('Present');

  // Logs filter & sort
  const [logDateFilter, setLogDateFilter] = useState('');
  const [logSortBy, setLogSortBy] = useState<'date' | 'name'>('date');

  // Selfie Modal
  const [selfieData, setSelfieData] = useState<any>(null);
  const [loadingSelfie, setLoadingSelfie] = useState(false);

  // Employees List
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Geofence settings states
  const [officeName, setOfficeName] = useState('AttendX HQ');
  const [latitude, setLatitude] = useState('21.125184');
  const [longitude, setLongitude] = useState('79.063881');
  const [radius, setRadius] = useState('50');
  const [lockHours, setLockHours] = useState('8.0');
  const [savingSettings, setSavingSettings] = useState(false);

  // Admin Secret Code states
  const [currentSecretCode, setCurrentSecretCode] = useState('');
  const [newSecretCode, setNewSecretCode] = useState('');
  const [confirmSecretCode, setConfirmSecretCode] = useState('');
  const [savingSecretCode, setSavingSecretCode] = useState(false);
  const [secretCodeMsg, setSecretCodeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General loading states
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Excel export month/year selector state (1-12)
  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());

  // --- 10-minute Session Timeout ---
  const handleSessionLogout = useCallback(() => {
    localStorage.clear();
    router.push('/');
  }, [router]);

  useEffect(() => {
    const checkExpiration = () => {
      const lastActivity = parseInt(localStorage.getItem('attendx_admin_last_activity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        handleSessionLogout();
      }
    };

    const updateActivity = () => {
      const lastActivity = parseInt(localStorage.getItem('attendx_admin_last_activity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        handleSessionLogout();
        return;
      }
      localStorage.setItem('attendx_admin_last_activity', Date.now().toString());
    };

    localStorage.setItem('attendx_admin_last_activity', Date.now().toString());

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration();
      }
    };

    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledUpdate = () => {
      if (!throttleTimeout) {
        updateActivity();
        throttleTimeout = setTimeout(() => { throttleTimeout = null; }, 2000);
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, throttledUpdate, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const intervalId = setInterval(checkExpiration, 5000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, throttledUpdate));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [handleSessionLogout]);

  // Check auth and load defaults
  useEffect(() => {
    const adminToken = localStorage.getItem('attendx_admin_token');
    const adminName = localStorage.getItem('attendx_admin_username');

    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    setToken(adminToken);
    setAdminUser(adminName || 'Admin');
    
    // Set default date filter to today IST
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    setLogDateFilter(todayIST);

    _loadAllDashboardData(adminToken);
  }, []);

  const _loadAllDashboardData = async (adminToken: string) => {
    setLoadingDashboard(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const config = { headers: { Authorization: `Bearer ${adminToken}` } };

      // 1. Get Metrics & Charts
      const statsRes = await axios.get(`${backendUrl}/api/admin/stats`, config);
      setMetrics(statsRes.data.metrics);
      setWeeklyChart(statsRes.data.charts.weekly);

      // 2. Get Geofencing Configs
      const settingsRes = await axios.get(`${backendUrl}/api/admin/settings`, config);
      const s = settingsRes.data;
      if (s) {
        setOfficeName(s.officeName);
        setLatitude(s.latitude.toString());
        setLongitude(s.longitude.toString());
        setRadius(s.radiusMeters.toString());
        setLockHours(s.minHoursBeforePunchOut.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // 1. Fetch Attendance Logs Table (with date filter and sort)
  const fetchLogs = async (dateOverride?: string, sortOverride?: string) => {
    setLoadingLogs(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const dateParam = dateOverride || logDateFilter;
      const sortParam = sortOverride || logSortBy;
      const response = await axios.get(`${backendUrl}/api/admin/attendance?date=${dateParam}&sort=${sortParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // 2. Fetch Employees lists
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/admin/employees?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Trigger tabs queries
  useEffect(() => {
    if (activeTab === 'logs' && token) fetchLogs();
    if (activeTab === 'employees' && token) fetchEmployees();
  }, [activeTab, searchQuery]);

  // Refetch logs when date filter or sort changes
  useEffect(() => {
    if (activeTab === 'logs' && token && logDateFilter) {
      fetchLogs(logDateFilter, logSortBy);
    }
  }, [logDateFilter, logSortBy]);

  // Adjust Attendance log submit
  const handleAdjustLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/admin/attendance/adjust`, {
        id: selectedLog.id,
        punchIn: editInTime || null,
        punchOut: editOutTime || null,
        status: editStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedLog(null);
      fetchLogs();
      _loadAllDashboardData(token);
    } catch (e) {
      console.error(e);
      alert("Failed to override punch log.");
    }
  };

  // View captured verification selfie details
  const handleViewSelfie = async (selfieId: string) => {
    setLoadingSelfie(true);
    setSelfieData(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/admin/selfie/${selfieId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelfieData(response.data);
    } catch (e) {
      console.error(e);
      alert("Could not load validation selfie file.");
    } finally {
      setLoadingSelfie(false);
    }
  };

  // Delete Employee profile
  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee? This action is permanent and clears all attendance sheets.")) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.delete(`${backendUrl}/api/admin/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEmployees();
    } catch (e) {
      console.error(e);
    }
  };

  // Clear biometrics embeddings
  const handleResetFace = async (id: string) => {
    if (!confirm("Clear this employee's face embedding vectors? They must scan face to register again on next login.")) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/admin/employees/${id}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEmployees();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Office geofence coordinates settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/admin/settings`, {
        officeName,
        latitude,
        longitude,
        radiusMeters: radius,
        minHoursBeforePunchOut: lockHours,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Office geofence updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Admin Secret Code
  const handleChangeSecretCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecretCodeMsg(null);

    if (!currentSecretCode || !newSecretCode || !confirmSecretCode) {
      setSecretCodeMsg({ type: 'error', text: 'All secret code fields are required.' });
      return;
    }

    if (newSecretCode !== confirmSecretCode) {
      setSecretCodeMsg({ type: 'error', text: 'New secret code and confirm secret code do not match.' });
      return;
    }

    setSavingSecretCode(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/admin/change-secret-code`, {
        currentSecretCode,
        newSecretCode,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSecretCodeMsg({ type: 'success', text: response.data.message || 'Admin Secret Code updated successfully!' });
      setCurrentSecretCode('');
      setNewSecretCode('');
      setConfirmSecretCode('');
    } catch (err: any) {
      console.error(err);
      setSecretCodeMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update Secret Code.' });
    } finally {
      setSavingSecretCode(false);
    }
  };

  // Download XLS Attendance Spreadsheet sheet for NSM & Associates
  const handleExcelExport = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/admin/attendance/export?month=${exportMonth}&year=${exportYear}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NSM_Associates_Attendance_${exportYear}_${exportMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      alert("Failed to export Excel report.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  // Recharts Pie Chart definitions
  const pieData = [
    { name: 'Present Today', value: metrics.presentToday },
    { name: 'Absent Today', value: metrics.absentToday },
  ];
  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Side Nav panel */}
      <div className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-white text-sm">
              X
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Attend<span className="text-rose-500">X</span> Admin
            </span>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <Users className="w-4 h-4" /> Dashboard Stats
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${activeTab === 'logs' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <Calendar className="w-4 h-4" /> Attendance Logs
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${activeTab === 'employees' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <Users className="w-4 h-4" /> Employee Profiles
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${activeTab === 'settings' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <Settings className="w-4 h-4" /> Office Geofencing
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/60">
          <div className="text-xs text-slate-500 font-bold mb-3">Logged in as {adminUser}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-950 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl py-2 px-4 flex items-center justify-center gap-2 font-bold text-xs transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto min-h-0">
        
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight capitalize">{activeTab} Manager</h1>
            <p className="text-slate-400 text-xs mt-1">Real-time attendance controls and geofence telemetry audits.</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ThemeToggle />

            {/* Month & Year Selectors for Excel Export */}
            <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-2 py-1 gap-1.5 shadow-inner">
              <select
                value={exportMonth}
                onChange={(e) => setExportMonth(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs font-semibold py-1.5 rounded focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-slate-900 text-white">Jan</option>
                <option value={2} className="bg-slate-900 text-white">Feb</option>
                <option value={3} className="bg-slate-900 text-white">Mar</option>
                <option value={4} className="bg-slate-900 text-white">Apr</option>
                <option value={5} className="bg-slate-900 text-white">May</option>
                <option value={6} className="bg-slate-900 text-white">Jun</option>
                <option value={7} className="bg-slate-900 text-white">Jul</option>
                <option value={8} className="bg-slate-900 text-white">Aug</option>
                <option value={9} className="bg-slate-900 text-white">Sep</option>
                <option value={10} className="bg-slate-900 text-white">Oct</option>
                <option value={11} className="bg-slate-900 text-white">Nov</option>
                <option value={12} className="bg-slate-900 text-white">Dec</option>
              </select>
              <span className="text-slate-600">/</span>
              <select
                value={exportYear}
                onChange={(e) => setExportYear(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs font-semibold py-1.5 rounded focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleExcelExport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 px-4 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              title={`Download Attendance Report for ${exportMonth}/${exportYear}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel Sheet
            </button>
            <button 
              onClick={() => _loadAllDashboardData(token)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {loadingDashboard ? (
          <div className="py-24 flex justify-center items-center">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* TAB 1: Dashboard Stats */}
            {activeTab === 'dashboard' && (
              <>
                {/* Stats row cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between items-start">
                    <Users className="w-5 h-5 text-blue-500 mb-3" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Staff</span>
                      <h3 className="text-2xl font-black text-white mt-0.5">{metrics.totalEmployees}</h3>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-3" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Punched In</span>
                      <h3 className="text-2xl font-black text-white mt-0.5">{metrics.presentToday}</h3>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between items-start">
                    <AlertTriangle className="w-5 h-5 text-rose-500 mb-3" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Absent Today</span>
                      <h3 className="text-2xl font-black text-white mt-0.5">{metrics.absentToday}</h3>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between items-start">
                    <Clock className="w-5 h-5 text-amber-500 mb-3" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Punches Pending</span>
                      <h3 className="text-2xl font-black text-white mt-0.5">{metrics.pendingPunchOuts}</h3>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-5 flex flex-col justify-between items-start">
                    <Percent className="w-5 h-5 text-purple-500 mb-3" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attendance %</span>
                      <h3 className="text-2xl font-black text-white mt-0.5">{metrics.attendancePercentage}%</h3>
                    </div>
                  </div>
                </div>

                {/* Analytical Charts grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="glass-card rounded-3xl p-6 lg:col-span-2">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider text-slate-400">Weekly Attendance (Punch Ins)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyChart}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E11D48" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke="#475569" />
                          <YAxis stroke="#475569" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                          <Area type="monotone" dataKey="count" stroke="#E11D48" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card rounded-3xl p-6 flex flex-col justify-between items-center text-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 self-start mb-6">Today's Attendance Ratio</h3>
                    {metrics.presentToday + metrics.absentToday === 0 ? (
                      <div className="my-auto text-xs text-slate-500 font-bold">No punches recorded today.</div>
                    ) : (
                      <div className="h-44 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="flex gap-6 mt-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Present ({metrics.presentToday})
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Absent ({metrics.absentToday})
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: Attendance Logs with Date Filter, Sort, S.No. */}
            {activeTab === 'logs' && (
              <div className="glass-card rounded-3xl p-6">
                {/* Filter & Sort Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      value={logDateFilter}
                      onChange={(e) => setLogDateFilter(e.target.value)}
                      className="bg-transparent border-none focus:outline-none text-sm text-white font-semibold"
                    />
                  </div>
                  <button
                    onClick={() => setLogSortBy(logSortBy === 'date' ? 'name' : 'date')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      logSortBy === 'name' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {logSortBy === 'name' ? 'Sorted by Name' : 'Sort by Name'}
                  </button>
                  <span className="text-xs text-slate-500 font-semibold ml-auto">
                    {logs.length} record{logs.length !== 1 ? 's' : ''} for {logDateFilter}
                  </span>
                </div>

                {loadingLogs ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
                ) : logs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm font-semibold">No attendance logs found for {logDateFilter}.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          <th className="pb-3 w-12">S.No.</th>
                          <th className="pb-3">Employee Name</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-center">Punch In</th>
                          <th className="pb-3 text-center">Punch Out</th>
                          <th className="pb-3 text-center">Selfies</th>
                          <th className="pb-3 text-center">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-sm">
                        {logs.map((log, index) => (
                          <tr key={log.id} className="hover:bg-slate-900/10 transition-all">
                            <td className="py-4 text-slate-500 font-bold text-xs">{index + 1}</td>
                            <td className="py-4 text-slate-200 font-bold">{log.name}</td>
                            <td className="py-4 text-slate-400 font-semibold">{log.date}</td>
                            <td className="py-4 text-center text-slate-400 font-mono">
                              {log.punchIn ? new Date(log.punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '--:--'}
                            </td>
                            <td className="py-4 text-center text-slate-400 font-mono">
                              {log.punchOut ? new Date(log.punchOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '--:--'}
                            </td>
                            <td className="py-4 text-center">
                              <div className="flex justify-center gap-2">
                                {log.punchInSelfieId && (
                                  <button 
                                    onClick={() => handleViewSelfie(log.punchInSelfieId)}
                                    className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-800 text-blue-400 hover:text-white text-xs font-bold flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> In
                                  </button>
                                )}
                                {log.punchOutSelfieId && (
                                  <button 
                                    onClick={() => handleViewSelfie(log.punchOutSelfieId)}
                                    className="bg-slate-900 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-800 text-rose-400 hover:text-white text-xs font-bold flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Out
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                                log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' :
                                log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400' :
                                log.status === 'Sunday' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-slate-850 text-slate-400'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => {
                                  setSelectedLog(log);
                                  setEditInTime(log.punchIn ? log.punchIn.split('.')[0] : '');
                                  setEditOutTime(log.punchOut ? log.punchOut.split('.')[0] : '');
                                  setEditStatus(log.status);
                                }}
                                className="bg-slate-900 hover:bg-rose-500/10 p-2 rounded-xl text-rose-400 hover:text-white transition-all border border-slate-800"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Employee Database Management */}
            {activeTab === 'employees' && (
              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl mb-6 max-w-sm">
                  <Search className="w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by Employee Name or Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-650"
                  />
                </div>

                {loadingEmployees ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>
                ) : employees.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm font-semibold">No employee profiles found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Phone</th>
                          <th className="pb-3">Registered At</th>
                          <th className="pb-3 text-center">Face Biometrics</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-sm">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-900/10 transition-all">
                            <td className="py-4 text-slate-200 font-bold">{emp.name}</td>
                            <td className="py-4 text-slate-400 font-semibold">{emp.phone}</td>
                            <td className="py-4 text-slate-500">{new Date(emp.registeredAt).toLocaleDateString('en-US')}</td>
                            <td className="py-4 text-center">
                              <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${emp.hasEmbeddings ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {emp.hasEmbeddings ? 'Embeddings Loaded' : 'No Biometrics'}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleResetFace(emp.id)}
                                  title="Reset Face Embeddings"
                                  className="bg-slate-900 hover:bg-amber-500/10 p-2 rounded-xl text-amber-500 border border-slate-800 hover:border-amber-500/20"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  title="Delete Employee"
                                  className="bg-slate-900 hover:bg-rose-500/10 p-2 rounded-xl text-rose-500 border border-slate-800 hover:border-rose-500/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Office Target Config Settings */}
            {activeTab === 'settings' && (
              <div className="glass-card rounded-3xl p-8 max-w-xl">
                <h3 className="text-lg font-bold text-white mb-6">Configure Geofence Office Boundary</h3>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Office Name</label>
                    <input
                      type="text"
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Radius Limits (meters)</label>
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Punch Out Lock (Hours)</label>
                      <input
                        type="text"
                        value={lockHours}
                        onChange={(e) => setLockHours(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl py-3.5 px-6 transition-all mt-4 text-sm"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save Settings'}
                  </button>
                </form>

                {/* Security Section: Admin Secret Code */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-rose-500" />
                    <h4 className="text-base font-bold text-white">Admin Security — Secret Code</h4>
                  </div>
                  <p className="text-slate-400 text-xs mb-6">
                    Change the secret code used for instant admin authentication from the unified login field.
                  </p>

                  <form onSubmit={handleChangeSecretCode} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Secret Code</label>
                      <input
                        type="password"
                        value={currentSecretCode}
                        onChange={(e) => setCurrentSecretCode(e.target.value)}
                        placeholder="Enter current secret code"
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Secret Code</label>
                      <input
                        type="password"
                        value={newSecretCode}
                        onChange={(e) => setNewSecretCode(e.target.value)}
                        placeholder="Enter new secret code"
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Secret Code</label>
                      <input
                        type="password"
                        value={confirmSecretCode}
                        onChange={(e) => setConfirmSecretCode(e.target.value)}
                        placeholder="Confirm new secret code"
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm"
                      />
                    </div>

                    {secretCodeMsg && (
                      <div className={`p-3 rounded-xl text-xs font-semibold ${secretCodeMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                        {secretCodeMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={savingSecretCode}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl py-3.5 px-6 transition-all text-sm border border-slate-700 flex items-center gap-2"
                    >
                      {savingSecretCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-rose-400" />}
                      Update Secret Code
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* MODAL 1: Overrides Adjustments Form */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-1">Adjust Punch Log</h3>
            <span className="text-slate-500 text-xs font-semibold">Editing logs of {selectedLog.name} on {selectedLog.date}</span>

            <form onSubmit={handleAdjustLog} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Punch In Time</label>
                <input
                  type="text"
                  value={editInTime}
                  onChange={(e) => setEditInTime(e.target.value)}
                  placeholder="e.g. 2026-07-12T09:15:00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Punch Out Time</label>
                <input
                  type="text"
                  value={editOutTime}
                  onChange={(e) => setEditOutTime(e.target.value)}
                  placeholder="e.g. 2026-07-12T17:30:00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm font-semibold"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-3 font-bold text-xs"
                >
                  Save Corrections
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl py-3 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Selfie Validation Frame & Leaflet Map coordinates tracker */}
      {selfieData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-lg w-full border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Punch Verification Details</h3>
              <button 
                onClick={() => setSelfieData(null)}
                className="text-slate-400 hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Captured verification image */}
              <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
                <img 
                  src={selfieData.image} 
                  alt="Verification Selfie" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white px-2 py-1 rounded text-[10px] border border-slate-800 uppercase tracking-widest font-extrabold">
                  {selfieData.type} selfie image
                </span>
              </div>

              {/* Geo tracking metadata */}
              <div className="flex flex-col justify-between text-xs space-y-3 font-semibold text-slate-400">
                <div className="bg-slate-900/80 p-4 rounded-xl space-y-2 border border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Punch Timestamp</span>
                    <span className="text-white font-mono">{new Date(selfieData.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Captured Coordinate</span>
                    <span className="text-white font-mono">{selfieData.latitude.toFixed(6)}, {selfieData.longitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">GPS Accuracy Radius</span>
                    <span className="text-white font-mono">±{selfieData.gpsAccuracy.toFixed(1)} meters</span>
                  </div>
                </div>

                {/* Leaflet GPS Marker Map placeholder */}
                <div className="w-full h-32 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {typeof window !== 'undefined' ? (
                    <MapContainer 
                      center={[selfieData.latitude, selfieData.longitude]} 
                      zoom={15} 
                      scrollWheelZoom={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selfieData.latitude, selfieData.longitude]}>
                        <Popup>
                          Swipe location coordinates
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <span>Loading maps telemetry...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
