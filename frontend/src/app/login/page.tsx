"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import { setUser } from "@/lib/user";
import { setClientId, setUserIdentity } from "@/lib/clientId";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Mail, Lock, User, ArrowRight,
  Pencil, Ruler, Type, MonitorPlay
} from "lucide-react";

// --- Creative Assets ---

const GeometricShape = ({ delay, type, color, size = "w-16 h-16", x, y }: { delay: number, type: 'circle' | 'square' | 'triangle' | 'blob', color: string, size?: string, x?: string, y?: string }) => {
  const variants = {
    hidden: { scale: 0, rotate: 0, opacity: 0 },
    visible: {
      scale: [1, 1.2, 1],
      rotate: 360,
      opacity: 0.6,
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay
      }
    }
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={`absolute ${color} backdrop-blur-3xl mix-blend-multiply filter blur-xl`}
      style={{ left: x, top: y }}
    >
      {type === 'circle' && <div className={`${size} rounded-full border-[20px] border-current opacity-70`} />}
      {type === 'square' && <div className={`${size} border-[20px] border-current opacity-70 rotate-12`} />}
      {type === 'triangle' && <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[80px] border-b-current opacity-70" />}
      {type === 'blob' && <div className={`${size} rounded-full bg-current opacity-50 animate-blob`} />}
    </motion.div>
  );
};

// Top-right animated sketch zone
const SketchAnimation = () => {
  return (
    <svg className="w-full h-full" viewBox="0 0 200 200">
      <motion.path
        d="M 20 180 Q 100 20 180 180"
        fill="transparent"
        stroke="#60A5FA" // Blue
        strokeWidth="4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="50" y="50" width="100" height="80"
        fill="transparent"
        stroke="#F472B6" // Pink
        strokeWidth="4"
        initial={{ pathLength: 0, rotate: 0 }}
        animate={{ pathLength: 1, rotate: 10 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.circle
        cx="100" cy="100" r="40"
        fill="transparent"
        stroke="#A78BFA" // Purple
        strokeWidth="4"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
      />
    </svg>
  )
}

// Typing simulation component
const TypewriterEffect = () => {
  const text = "Brainstorm. Plan. Create.";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i > text.length) i = 0; // Loop
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1 text-2xl font-mono text-slate-700 mt-4 h-8 justify-center">
      <span className="text-pink-500">{">"}</span>
      {displayedText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="w-3 h-6 bg-slate-800 ml-1"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isSignup ? "signup" : "login";
    const body = isSignup ? { email, password, name } : { email, password };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Authentication failed");
        setLoading(false);
        return;
      }
      setToken(data.token);
      setUser(data.user);
      setClientId(data.user.id);
      setUserIdentity({
        name: data.user.name,
        avatar: data.user.avatar,
        color: data.user.color
      });
      router.push("/boards");
    } catch (err) {
      alert("Connection error. Ensure backend is running.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden font-sans text-slate-800">

      {/* --- Background Pattern --- */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* --- LEFT: The "Presenting / Explaining" Zone --- */}
      <div className="hidden lg:flex w-3/5 relative flex-col justify-center items-center p-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">

        {/* Animated Background Shapes (Behind Panel) */}
        <GeometricShape delay={0} type="blob" color="text-blue-300" size="w-96 h-96" x="10%" y="10%" />
        <GeometricShape delay={2} type="blob" color="text-purple-300" size="w-80 h-80" x="60%" y="60%" />
        <GeometricShape delay={4} type="blob" color="text-pink-300" size="w-72 h-72" x="20%" y="70%" />

        {/* Floating Geometric Elements */}
        <div className="absolute top-20 left-20"><GeometricShape delay={0} type="circle" color="text-blue-400" /></div>
        <div className="absolute bottom-40 right-20"><GeometricShape delay={1} type="square" color="text-purple-400" /></div>
        <div className="absolute top-1/2 left-10"><GeometricShape delay={2} type="triangle" color="text-pink-400" /></div>

        {/* Central "Presentation" Board */}
        <motion.div
          className="w-full max-w-2xl aspect-video bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative p-8 flex flex-col items-center justify-center overflow-hidden z-10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Board Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-white/80 p-3 rounded-full shadow-sm border border-slate-100 backdrop-blur-sm">
            <Pencil className="w-5 h-5 text-pink-500" />
            <Ruler className="w-5 h-5 text-blue-500" />
            <Type className="w-5 h-5 text-purple-500" />
            <MonitorPlay className="w-5 h-5 text-green-500" />
          </div>

          {/* Board Content Animation */}
          <div className="text-center z-10 mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-6xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                SketchFlow
              </h1>
            </motion.div>

            <TypewriterEffect />
          </div>



        </motion.div>

        <div className="absolute top-[20%] right-[10%] w-[400px] h-[300px] opacity-40 pointer-events-none -rotate-12 z-0">
          <SketchAnimation />
        </div>
        <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[250px] opacity-30 pointer-events-none rotate-6 z-0">
          <SketchAnimation />
        </div>

        {/* EXTRA: Different Floating Icons (Grid, Layout, Code) behind panel */}
        <motion.div
          className="absolute top-[15%] left-[15%] text-indigo-300 opacity-50 z-0"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="grid grid-cols-2 gap-2 p-2 border-2 border-current rounded-lg transform -rotate-12">
            <div className="w-8 h-8 bg-current rounded-sm"></div>
            <div className="w-8 h-8 bg-current rounded-sm"></div>
            <div className="w-8 h-8 bg-current rounded-sm"></div>
            <div className="w-8 h-8 bg-current rounded-sm"></div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-[20%] right-[20%] text-purple-300 opacity-50 z-0"
          animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="w-24 h-16 border-2 border-current rounded-lg flex flex-col justify-center gap-2 p-2 transform rotate-6">
            <div className="w-16 h-2 bg-current rounded-full"></div>
            <div className="w-10 h-2 bg-current rounded-full"></div>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-[40%] left-[5%] text-blue-200 opacity-50 z-0"
          animate={{ x: [0, 20, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <div className="w-16 h-16 border-2 border-dashed border-current rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-current rounded-full"></div>
          </div>
        </motion.div>

        <p className="mt-8 text-slate-400 text-lg font-medium relative z-10">Real-time collaboration for the modern era.</p>
      </div>

      {/* --- RIGHT: Login Form --- */}
      <div className="w-full lg:w-2/5 bg-white/95 backdrop-blur-sm border-l border-slate-100 p-12 flex flex-col justify-center relative shadow-2xl z-20 overflow-hidden">

        {/* Subtle Decorative Blobs for Right Panel (Animated) */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-60 pointer-events-none"
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-40 pointer-events-none"
          animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="max-w-md mx-auto w-full relative z-10">
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700">
              {isSignup ? "Join the Board." : "Log in"}
            </h2>
            <p className="text-slate-500 mb-8 text-lg">
              {isSignup ? "Create an account to start collaborating." : "Sign in to access your boards."}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  key="name"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-300" />
                    <input
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 shadow-sm group-hover:border-purple-300"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignup}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-300" />
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 shadow-sm group-hover:border-purple-300"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="text-sm font-bold text-slate-700 block mb-2 uppercase tracking-wide">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-300" />
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 font-medium focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-300 shadow-sm group-hover:border-purple-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(147 51 234 / 0.3)" }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <span className="relative z-10">{isSignup ? "Sign Up" : "Log In"}</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Social Logins */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-bold tracking-wider">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button disabled className="flex items-center justify-center w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm opacity-50 cursor-not-allowed" title="Coming Soon">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button disabled className="flex items-center justify-center w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-sm opacity-50 cursor-not-allowed" title="Coming Soon">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </button>
            </div>
          </motion.div>

          <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium w-full"
            >
              {isSignup ? (
                <span>Already a member? <span className="text-purple-600 font-bold ml-1">Log in here</span></span>
              ) : (
                <span>New here? <span className="text-purple-600 font-bold ml-1">Create an account</span></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
