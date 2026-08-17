import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  LogOut, Clock, Calendar, CheckCircle, Percent, AlertCircle, 
  MapPin, LogIn, Laptop, Globe, Loader2 
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

export default function UserDashboard() {
  const router = useRouter();

  // Session states
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  
  // Punch states
  const [punchInTime, setPunchInTime] = useState('');
  const [punchOutTime, setPunchOutTime] = useState('');
  const [minHours, setMinHours] = useState(8.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stats & logs states
  const [attendancePercentage, setAttendancePercentage] = useState(100);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Time ticker state
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // --- 10-minute Session Timeout ---
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

  const handleSessionLogout = useCallback(() => {
    localStorage.clear();
    router.push('/');
  }, [router]);

  useEffect(() => {
    // Check if the session has already expired
    const checkExpiration = () => {
      const lastActivity = parseInt(localStorage.getItem('attendx_last_activity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        handleSessionLogout();
      }
    };

    const updateActivity = () => {
      // If they interact after 10 mins (e.g. returning to tab), log them out BEFORE resetting
      const lastActivity = parseInt(localStorage.getItem('attendx_last_activity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
        handleSessionLogout();
        return;
      }
      localStorage.setItem('attendx_last_activity', Date.now().toString());
    };

    // Initialize activity tracking
    localStorage.setItem('attendx_last_activity', Date.now().toString());

    // When returning to a backgrounded mobile tab, this fires instantly
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration();
      }
    };

    // Throttled activity events so we don't spam localStorage on mousemove
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
    
    // Interval check for devices left with the screen on
    const intervalId = setInterval(checkExpiration, 5000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, throttledUpdate));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [handleSessionLogout]);

  useEffect(() => {
    // Tick current time
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load session from localStorage on start
  useEffect(() => {
    const empId = localStorage.getItem('attendx_employee_id');
    const name = localStorage.getItem('attendx_employee_name');
    const inTime = localStorage.getItem('attendx_punch_in');
    const outTime = localStorage.getItem('attendx_punch_out');
    const hours = localStorage.getItem('attendx_min_hours');

    if (!empId || !name) {
      router.push('/user/login');
      return;
    }

    setEmployeeId(empId);
    setEmployeeName(name);
    setPunchInTime(inTime || '');
    setPunchOutTime(outTime || '');
    setMinHours(parseFloat(hours || '8.0'));

    _loadLogs(empId);
  }, []);

  const _loadLogs = async (id: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/attendance/history/${id}`);
      
      const { history: list, stats } = response.data;
      setHistory(list);
      setAttendancePercentage(stats.attendancePercentage);
      setPresentCount(stats.presentCount);
      setAbsentCount(stats.absentCount);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Perform Punch In / Out API Requests
  const handlePunch = async (action: 'IN' | 'OUT') => {
    if (action === 'OUT') {
      const confirm1 = window.confirm("Are you sure you want to Punch Out now?");
      if (!confirm1) return;

      const confirm2 = window.confirm("WARNING: Once you Punch Out, your attendance session for today will be closed and you cannot log in or register another punch again today. Do you wish to proceed?");
      if (!confirm2) return;
    }

    setIsProcessing(true);
    setError('');
    setSuccessMsg('');

    const lat = localStorage.getItem('attendx_gps_lat');
    const lng = localStorage.getItem('attendx_gps_lng');
    const acc = localStorage.getItem('attendx_gps_acc');
    const selfie = localStorage.getItem('attendx_last_capture');

    if (!lat || !lng || !selfie) {
      setError("Secure verification details missing. Go back and scan face again.");
      setIsProcessing(false);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const endpoint = action === 'IN' ? '/api/attendance/punch-in' : '/api/attendance/punch-out';
      
      const response = await axios.post(`${backendUrl}${endpoint}`, {
        employeeId,
        name: employeeName,
        latitude: lat,
        longitude: lng,
        gpsAccuracy: acc,
        selfieBase64: selfie,
        deviceInfo: navigator.platform || "Web Device",
        browserInfo: navigator.userAgent.split(' ')[0] || "Browser",
      });

      if (response.data.success) {
        const timeStr = new Date(response.data.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (action === 'IN') {
          setPunchInTime(response.data.time);
          localStorage.setItem('attendx_punch_in', response.data.time);
          setSuccessMsg(`Punch-In Successful at ${timeStr}!`);
        } else {
          setPunchOutTime(response.data.time);
          localStorage.setItem('attendx_punch_out', response.data.time);
          setSuccessMsg(`Punch-Out Successful at ${timeStr}!`);
        }

        // Trigger particles celebration on successful punch
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        
        // Reload logs list
        _loadLogs(employeeId);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const formattedTime = (isoString: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center mb-8 bg-slate-900/60 border border-slate-800 p-4 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">
              A
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">{employeeName}</h2>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider">Employee Portal</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 bg-slate-950/40 hover:bg-rose-500/5 px-4 py-2 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Ticker & Punch Controls */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="text-center md:text-left">
                <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">{currentDate}</span>
                <h1 className="text-5xl font-black text-white tracking-tight mt-2 mb-2 font-mono">{currentTime}</h1>
                <span className="text-xs text-blue-400 font-bold flex items-center gap-1.5 justify-center md:justify-start">
                  <MapPin className="w-3.5 h-3.5" /> Geofence Verified: Office Premises
                </span>
              </div>

              {/* Punch State trigger Button */}
              <div className="flex flex-col items-center">
                {isProcessing ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center w-52 h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                    <span className="text-xs font-bold text-slate-400">Processing Punch...</span>
                  </div>
                ) : punchInTime === '' ? (
                  <button
                    onClick={() => handlePunch('IN')}
                    className="w-52 h-32 bg-emerald-600 hover:bg-emerald-500 hover:scale-103 active:scale-98 border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl shadow-emerald-500/20 transition-all group"
                  >
                    <LogIn className="w-10 h-10 mb-2 group-hover:translate-y-[-2px] transition-transform" />
                    <span className="font-extrabold text-sm uppercase tracking-wider">Punch In</span>
                  </button>
                ) : punchOutTime === '' ? (
                  <button
                    onClick={() => handlePunch('OUT')}
                    className="w-52 h-32 bg-rose-600 hover:bg-rose-500 hover:scale-103 active:scale-98 border border-rose-500/20 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl shadow-rose-500/20 transition-all group"
                  >
                    <LogOut className="w-10 h-10 mb-2 group-hover:translate-y-[-2px] transition-transform" />
                    <span className="font-extrabold text-sm uppercase tracking-wider">Punch Out</span>
                  </button>
                ) : (
                  <div className="w-52 h-32 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                    <span className="font-extrabold text-xs uppercase tracking-wider">Punch Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Feedback Banners */}
            {error && (
              <div className="flex items-center gap-3 text-sm text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-3 text-sm text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                <CheckCircle className="w-5 h-5 flex-shrink-0" /> {successMsg}
              </div>
            )}

            {/* Daily card state tracker logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-3xl p-5 border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Punch In Time</h4>
                    <span className="text-lg font-bold text-white">{formattedTime(punchInTime)}</span>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${punchInTime ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                  {punchInTime ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div className="glass-card rounded-3xl p-5 border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">Punch Out Time</h4>
                    <span className="text-lg font-bold text-white">{formattedTime(punchOutTime)}</span>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${punchOutTime ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-900 text-slate-500'}`}>
                  {punchOutTime ? 'Completed' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics stats sidecards */}
          <div className="flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <Percent className="w-8 h-8 text-blue-500 mb-6" />
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Attendance Rate</span>
                <h3 className="text-4xl font-black text-white mt-1">{attendancePercentage}%</h3>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between items-start">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-6" />
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Present Count (Month)</span>
                <h3 className="text-4xl font-black text-white mt-1">{presentCount}</h3>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between items-start">
              <AlertCircle className="w-8 h-8 text-rose-500 mb-6" />
              <div>
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">Absent Count (Month)</span>
                <h3 className="text-4xl font-black text-white mt-1">{absentCount}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance logs list */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Recent Log History
          </h3>

          {isLoadingLogs ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-semibold">
              No punch logs found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-center">Punch In</th>
                    <th className="pb-3 text-center">Punch Out</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {history.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 text-slate-300 font-semibold">{log.date}</td>
                      <td className="py-3.5 text-center text-slate-400 font-mono">
                        {log.punchIn ? new Date(log.punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 text-center text-slate-400 font-mono">
                        {log.punchOut ? new Date(log.punchOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                          log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400' :
                          log.status === 'Absent' ? 'bg-rose-500/10 text-rose-400' :
                          log.status === 'Sunday' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
