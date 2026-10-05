"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, User, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import { api } from "@/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check if already authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("metroflow_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        if (res.token) {
          localStorage.setItem("metroflow_token", res.token);
          localStorage.setItem("metroflow_user", JSON.stringify(res.user));
          setSuccessMsg("Secure terminal link established. Access Granted.");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1000);
        }
      } else {
        await api.auth.register({ fullName, email, password });
        setSuccessMsg("Operator account created. Redirecting to login...");
        setTimeout(() => {
          setIsLogin(true);
          setFullName("");
          setPassword("");
          setLoading(false);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Credential verification failed. Access Denied.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center bg-[#0b0f19] px-6 text-slate-100 overflow-hidden cyber-grid font-mono">
      {/* Background Neon Gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Title Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 text-glow-cyan">
            METROFLOW SECURE NODE
          </h1>
        </div>

        {/* Biometric-styled Terminal Panel */}
        <div className="w-full rounded-2xl p-8 shadow-3xl glass-panel-glow border border-cyan-500/20">
          {/* Mode Switch Tab */}
          <div className="mb-6 flex justify-center space-x-8 border-b border-slate-800 pb-3">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`text-xs font-bold uppercase tracking-widest pb-1.5 transition-all ${
                isLogin ? "text-cyan-400 border-b-2 border-cyan-400 text-glow-cyan" : "text-slate-500 hover:text-slate-355"
              }`}
            >
              SECURE LOG IN
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`text-xs font-bold uppercase tracking-widest pb-1.5 transition-all ${
                !isLogin ? "text-cyan-400 border-b-2 border-cyan-400 text-glow-cyan" : "text-slate-500 hover:text-slate-355"
              }`}
            >
              REQUEST LINK
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-bold">
                  Operator Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-bold">
                Workstation Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@metroflow.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 font-bold">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-xs text-red-400 font-mono">
                <ShieldAlert size={16} className="shrink-0 animate-bounce" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-green-800/40 bg-green-950/20 p-3 text-xs text-green-400 font-mono animate-pulse">
                <ShieldCheck size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 py-3.5 font-mono text-[10px] font-black uppercase tracking-widest text-slate-950 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  <span>LINKING TERMINAL STATE...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>SIGN IN</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security advisory footer */}
        <div className="mt-8 text-center text-[8px] text-slate-700 uppercase tracking-widest max-w-xs">
          RESTRICTED TO WORKSTATION OPERATORS. ALL TRANSACTIONS LOGGED.
        </div>
      </div>
    </div>
  );
}
