import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Camera, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function RegisterUser() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  // States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Details, 2: Camera, 3: Success
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Pre-warm the backend and Face AI microservice from Vercel
  React.useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios.get(`${backendUrl}/api/auth/prewarm`).catch(() => {});
  }, []);

  // Video settings for react-webcam
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  // Step 1 validation
  const handleProceedToCamera = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in all details.');
      return;
    }
    if (phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    setStep(2);
  };

  // Capture face and submit to Node.js backend
  const handleCaptureAndRegister = async () => {
    if (!webcamRef.current) return;
    
    setIsProcessing(true);
    setError('');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Unable to capture frame from camera");
      }

      // Convert dataURI base64 back to binary blob for file upload
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('image', blob, 'profile.jpg');

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const registerRes = await axios.post(`${backendUrl}/api/auth/register`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (registerRes.data.success) {
        // Save to browser cache so they don't have to register again
        localStorage.setItem('attendx_employee_id', registerRes.data.employeeId);
        localStorage.setItem('attendx_employee_name', name.trim());
        setStep(3);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Biometric registration failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {step < 3 && (
          <button 
            onClick={() => step === 2 ? setStep(1) : router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Details */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-extrabold text-white mb-2">Self Registration</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Create your biometric employee check-in profile. Enter your details to continue.
              </p>

              <form onSubmit={handleProceedToCamera} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-500 font-semibold">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4 text-sm"
                >
                  Proceed to Camera
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Camera verification */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <h2 className="text-xl font-bold text-white mb-1">Face Scan</h2>
              <p className="text-slate-400 text-xs mb-6">
                Align your face inside the frame to map your biometrics.
              </p>

              {/* Webcam frame overlay */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 mb-6 bg-slate-950">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  mirrored={true}
                />
                <div className="absolute inset-0 border-2 border-dashed border-blue-500/40 rounded-2xl pointer-events-none margin-4 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 rounded-full opacity-35" />
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-500 font-semibold mb-4">{error}</p>
              )}

              <button
                disabled={isProcessing}
                onClick={handleCaptureAndRegister}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Face AI...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" /> Capture & Register Face
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 3: Successful state */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Registration Successful</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xs">
                Your face embeddings are securely stored. You can now check-in with your face.
              </p>

              <button
                onClick={() => router.push('/user/login')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-3.5 font-bold transition-all shadow-lg shadow-emerald-500/25 text-sm"
              >
                Launch Face Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
