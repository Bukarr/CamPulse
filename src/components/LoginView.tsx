import React, { useState } from 'react';
import { ShieldAlert, LogIn, Mail, RefreshCw, Compass, Map, Shield, Wrench, IdCard } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [matricNo, setMatricNo] = useState('U25MBBS1025');
  const [name, setName] = useState('Sani Bello');
  const [roleSelection, setRoleSelection] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    let finalEmail = email.trim().toLowerCase();
    let finalMatricNo = '';

    if (roleSelection === 'student') {
      const cleanMatric = matricNo.trim().toUpperCase();
      // Matric ID format regex: U25MBBS1025 (U25 = Admission Year, MBBS/COSC/EENG = Course, 1025 = 4 digit index)
      const matricRegex = /^[Uu]\d{2}[A-Za-z]{3,4}\d{4}$/;
      if (!cleanMatric || !matricRegex.test(cleanMatric)) {
        setError('Invalid Student Matric ID. Must follow ABU format e.g. U25MBBS1025 (U25 = Admission Year, MBBS = Department, 1025 = Student No.)');
        setIsLoading(false);
        return;
      }
      finalMatricNo = cleanMatric;
      finalEmail = `${cleanMatric.toLowerCase()}@student.abu.edu.ng`;
    } else {
      if (!finalEmail) {
        setError('Please provide a valid ABU staff or departmental email address.');
        setIsLoading(false);
        return;
      }

      // Standard ABU email verification regex matching: @student.abu.edu.ng or @abu.edu.ng
      const isABU = finalEmail.endsWith('.abu.edu.ng') || finalEmail.endsWith('@abu.edu.ng');
      if (!isABU) {
        setError('CamPulse staff login is restricted to Ahmadu Bello University domains (@abu.edu.ng or @tech.abu.edu.ng).');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: `matric-token-${Date.now()}`,
          email: finalEmail,
          name: name.trim() || (finalMatricNo ? `Student (${finalMatricNo})` : finalEmail.split('@')[0]),
          matricNo: finalMatricNo || undefined,
          roleSelection
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      // Successful login
      onLoginSuccess(data.user, data.token);

    } catch (err: any) {
      setError(err.message || 'Verification connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillMockEmail = (role: UserRole) => {
    setRoleSelection(role);
    setError(null);
    if (role === 'student') {
      setName('Sani Bello');
      setMatricNo('U25MBBS1025');
      setEmail('sbello@student.abu.edu.ng');
    } else if (role === 'admin') {
      setName('Prof. Ibrahim Usman');
      setEmail('iusman@abu.edu.ng');
    } else {
      setName('Musa Garba');
      setEmail('mgarba@tech.abu.edu.ng');
    }
  };

  return (
    <div id="login-splash-screen" className="bg-slate-950 text-slate-100 min-h-screen w-full flex items-center justify-center p-4 md:p-8 select-none overflow-y-auto">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
        
        {/* Left Column (Features Overview - Desktop only) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-950 to-teal-900 p-8 flex-col justify-between relative border-r border-slate-800">
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            {/* Branding Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Cam<span className="text-emerald-400">Pulse</span> ABU
                </h1>
                <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">Zaria Campus Operations</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-emerald-100 leading-snug">
                Smart Operations & Facility Reports
              </h2>
              <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
                Keep Ahmadu Bello University’s infrastructure in pristine shape with our real-time tracking, AI-assisted triage, and crowdsourced reporting ecosystem.
              </p>
            </div>

            {/* Feature lists */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 p-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-300">
                  <Map size={12} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-200">Interactive Campus Map</h4>
                  <p className="text-[10px] text-emerald-300/70">Pinpoint coordinates precisely with official campus sector bounds.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 p-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-300">
                  <Compass size={12} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-200">Gemma 4 AI Assistant</h4>
                  <p className="text-[10px] text-emerald-300/70">Voice interpretation, autonomous task classification, and operational digests.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 p-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-300">
                  <Shield size={12} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-200">Offline Caching Engine</h4>
                  <p className="text-[10px] text-emerald-300/70">Submit complaints even with zero connection; they sync when you return online.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-emerald-300/50 pt-8 relative z-10">
            Ahmadu Bello University • Engineering & Maintenance Division
          </div>
        </div>

        {/* Right Column (Login Form) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-slate-900/40">
          
          {/* Logo on Mobile only */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">
              Cam<span className="text-emerald-500">Pulse</span> ABU
            </h1>
          </div>

          <div className="space-y-5 my-auto">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider">
                <LogIn size={12} /> Secure Access Portal
              </div>
              <h3 className="text-base font-bold text-slate-100 font-sans mt-1">Sign In with Credentials</h3>
              <p className="text-[10px] text-slate-400">Restricted to student/faculty ABU domains.</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 rounded-xl leading-relaxed flex gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium text-[11px]">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Desired Workspace Role
                </label>
                <select
                  value={roleSelection}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setRoleSelection(newRole);
                    setError(null);
                    if (newRole === 'student' && !matricNo) {
                      setMatricNo('U25MBBS1025');
                      setName('Sani Bello');
                    }
                  }}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="student">Student Portal (Matric ID Access)</option>
                  <option value="admin">Administrator Portal (Staff Email)</option>
                  <option value="technician">Technician Duty Queue (Staff Email)</option>
                </select>
              </div>

              {roleSelection === 'student' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                      Student Matriculation ID (Matric ID)
                    </label>
                    <span className="text-[9px] text-slate-400 font-mono">e.g. U25MBBS1025</span>
                  </div>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 text-emerald-500" size={14} />
                    <input
                      type="text"
                      required
                      placeholder="U25MBBS1025"
                      value={matricNo}
                      onChange={(e) => {
                        setMatricNo(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      className="w-full text-xs bg-slate-950 border border-emerald-900/50 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold tracking-wider"
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
                    💡 <strong className="text-slate-300">Format Guide:</strong> <span className="font-mono text-emerald-300 font-bold">U25</span> (Year 2025) + <span className="font-mono text-emerald-300 font-bold">MBBS</span> (Course Code) + <span className="font-mono text-emerald-300 font-bold">1025</span> (Student Number)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Your Campus Email (.edu.ng)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={14} />
                    <input
                      type="email"
                      required
                      placeholder={roleSelection === 'admin' ? "iusman@abu.edu.ng" : "mgarba@tech.abu.edu.ng"}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Sani Bello"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-emerald-900/10"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Verifying domain...
                  </>
                ) : (
                  'Sign In Securely'
                )}
              </button>
            </form>

            {/* Demo Fast Login Buttons */}
            <div className="border-t border-slate-800 pt-4 space-y-2.5">
              <span className="block text-[8px] font-bold text-slate-500 text-center uppercase tracking-widest font-mono">
                💡 Fast Demo Presets (Bypasses Iframe Limits)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => fillMockEmail('student')}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-750 text-[10px] font-bold text-slate-300 py-2 rounded-lg text-center cursor-pointer transition-colors"
                >
                  Student
                </button>
                <button
                  onClick={() => fillMockEmail('admin')}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-750 text-[10px] font-bold text-slate-300 py-2 rounded-lg text-center cursor-pointer transition-colors"
                >
                  Admin
                </button>
                <button
                  onClick={() => fillMockEmail('technician')}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-750 text-[10px] font-bold text-slate-300 py-2 rounded-lg text-center cursor-pointer transition-colors"
                >
                  Tech
                </button>
              </div>
            </div>
          </div>

          {/* Footer credits */}
          <div className="text-[9px] text-slate-500 text-center leading-relaxed font-sans max-w-[90%] mx-auto mt-6">
            CamPulse ABU is an automated school facility operations management system. Restricted to authorized university portal emails.
          </div>

        </div>

      </div>
    </div>
  );
}
