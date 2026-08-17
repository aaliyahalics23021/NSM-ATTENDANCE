import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, Loader2, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import ThemeToggle from '@/components/ThemeToggle';

export default function UserLogin() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  // States
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user',
  };

  useEffect(() => {
    // Retrieve target employee verification data from unified login
    const targetId = localStorage.getItem('attendx_verify_employee_id');
    const targetName = localStorage.getItem('attendx_verify_name');

    if (!targetId || !targetName) {
      router.push('/');
      return;
    }

    setEmployeeId(targetId);
    setEmployeeName(targetName);

    // Pre-warm the backend and Face AI service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios.get(`${backendUrl}/api/auth/prewarm`).catch(() => {});

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser / webview.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        setError('GPS access denied. You must grant location permission to login.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [router]);

  // Capture face and perform 1:1 match
  const handleFaceLogin1to1 = async () => {
    if (!webcamRef.current) return;
    if (!gpsCoords) {
      setError('Waiting for accurate GPS location. Please allow location access.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Unable to capture frame from webcam.');
      }

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('latitude', gpsCoords.lat.toString());
      formData.append('longitude', gpsCoords.lng.toString());
      formData.append('image', blob, 'scan.jpg');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const loginRes = await axios.post(`${backendUrl}/api/auth/login-1to1`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (loginRes.data.success) {
        const { employeeId: empId, name, punchIn, punchOut, minHours } = loginRes.data;

        localStorage.setItem('attendx_employee_id', empId);
        localStorage.setItem('attendx_employee_name', name);
        localStorage.setItem('attendx_punch_in', punchIn || '');
        localStorage.setItem('attendx_punch_out', punchOut || '');
        localStorage.setItem('attendx_min_hours', minHours.toString());
        localStorage.setItem('attendx_gps_lat', gpsCoords.lat.toString());
        localStorage.setItem('attendx_gps_lng', gpsCoords.lng.toString());
        localStorage.setItem('attendx_gps_acc', gpsCoords.acc.toString());
        localStorage.setItem('attendx_last_capture', imageSrc);

        router.push('/user/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Face Verification Failed. Position your face clearly.';
      setError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors flex items-center justify-center p-4">
      {/* Theme Switcher Header */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Change Number
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center border border-slate-800 dark:border-slate-800 light:border-slate-200"
        >
          <div className="bg-blue-500/10 px-3 py-1 rounded-full text-xs font-semibold text-blue-400 border border-blue-500/20 mb-2">
            1:1 Face Verification
          </div>

          <h2 className="text-xl font-extrabold text-white dark:text-white light:text-slate-900 mb-1">
            {employeeName || 'Biometric Verification'}
          </h2>
          <p className="text-slate-400 text-xs mb-6">
            Position your face clearly inside the camera frame.
          </p>

          {/* Camera Frame */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 mb-6 bg-slate-950">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
              mirrored={true}
            />
            <div className="absolute inset-0 border-2 border-blue-500/25 rounded-2xl pointer-events-none margin-4 flex flex-col items-center justify-center">
              <div className="w-40 h-40 border-2 border-blue-500 rounded-full opacity-20 animate-pulse" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/80 px-3 py-1 rounded-full text-[10px] text-blue-400 border border-blue-500/20 uppercase tracking-widest font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" /> Scanner Active
              </div>
            </div>
          </div>

          {/* GPS status banner */}
          <div className="w-full mb-6">
            {gpsLoading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-400 font-medium bg-blue-500/10 py-3 px-4 rounded-xl border border-blue-500/20">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching location coordinates...
              </div>
            ) : gpsCoords ? (
              <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 py-3 px-4 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Location Locked ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
              </div>
            ) : (
              <div className="text-xs text-rose-400 font-medium bg-rose-500/10 py-3 px-4 rounded-xl border border-rose-500/20 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> Location permission required
              </div>
            )}
          </div>

          {error && (
            <div className="w-full mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center justify-between gap-2">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-slate-400 hover:text-white"
                title="Dismiss"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            disabled={isProcessing || gpsLoading || !gpsCoords}
            onClick={handleFaceLogin1to1}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Verifying Biometrics...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" /> Verify Face & Login
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
