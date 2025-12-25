"use client";

import { useState } from "react";
import { Sparkles, FileText, Briefcase, Settings, ArrowRight, CheckCircle, Loader2, LogOut, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSession, signIn, signOut } from "next-auth/react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export default function Home() {
  const { data: session } = useSession();
  const [step, setStep] = useState<"inputs" | "generating" | "done">("inputs");
  const [jobDescription, setJobDescription] = useState("");
  const [currentResume, setCurrentResume] = useState("");
  const [profileNotes, setProfileNotes] = useState(""); // Background Info
  const [statusMessage, setStatusMessage] = useState("");
  const [generatedDocUrl, setGeneratedDocUrl] = useState("");
  const [generatedCoverLetterUrl, setGeneratedCoverLetterUrl] = useState("");

  const handleGenerate = async () => {
    if (!jobDescription || !currentResume) {
      alert("Please fill in Job Description and Resume data");
      return;
    }

    if (!session) {
      alert("Please sign in with Google first.");
      return;
    }

    setStep("generating");
    setStatusMessage("Initializing...");

    try {
      // --- n8n MODE ONLY ---
      setStatusMessage("Sending data to n8n workflow...");
      const response = await fetch("/api/n8n-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          currentResume,
          profileNotes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "n8n Workflow failed");
      }

      if (data.resumeUrl) setGeneratedDocUrl(data.resumeUrl);
      if (data.coverLetterUrl) setGeneratedCoverLetterUrl(data.coverLetterUrl);

      setStatusMessage("Workflow Complete!");
      setStep("done");

    } catch (error) {
      console.error(error);
      const msg = (error as Error).message;
      setStatusMessage("Error: " + msg);
      // If it's a 404/waiting error, give a hint
      if (msg.includes("not registered") || msg.includes("waiting")) {
        alert("n8n timed out or isn't listening. Clicking 'Listen for test event' in n8n and try again!");
      }
      setStep("inputs");
    }
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="text-center space-y-6">
          <div className="inline-block p-4 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl shadow-2xl shadow-indigo-500/20 mb-4">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-fuchsia-200">ResumeForge</h1>
          <p className="text-slate-400 max-w-md mx-auto">Sign in to access your Google Drive for automatic resume generation.</p>
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-colors mx-auto"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10 w-full">

        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-fuchsia-200">
                ResumeForge
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">AI-Powered Tailoring (n8n Edition)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-800">
              {session?.user?.image && <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full" />}
              <span className="text-xs font-medium text-slate-400">{session?.user?.name}</span>
            </div>
            <button onClick={() => signOut()} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">

          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {step === "inputs" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Section title="Job Description" icon={Briefcase}>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      className="w-full h-48 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                    />
                  </Section>

                  <Section title="Your Master Resume" icon={FileText}>
                    <textarea
                      value={currentResume}
                      onChange={(e) => setCurrentResume(e.target.value)}
                      placeholder="Paste your full master resume content here..."
                      className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                    />
                  </Section>

                  <Section title="Background Info / Notes" icon={User}>
                    <textarea
                      value={profileNotes}
                      onChange={(e) => setProfileNotes(e.target.value)}
                      placeholder="(Optional) Add any specific notes, focusing points, or background info for this application..."
                      className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
                    />
                  </Section>
                </motion.div>
              )}

              {step === "generating" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[500px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-200 mb-2">
                      Running n8n Workflow...
                    </h2>
                    <p className="text-slate-400 animate-pulse">{statusMessage}</p>
                  </div>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[500px] flex flex-col items-center justify-center text-center space-y-8 bg-gradient-to-b from-slate-900/80 to-slate-950/80 rounded-3xl border border-emerald-500/20 backdrop-blur-sm"
                >
                  <div className="p-4 bg-emerald-500/10 rounded-full ring-1 ring-emerald-500/50">
                    <CheckCircle className="w-16 h-16 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Application Ready!</h2>
                    <p className="text-slate-400">Your documents have been created in Google Drive.</p>
                  </div>

                  <div className="flex gap-4">
                    {generatedDocUrl && (
                      <a
                        href={generatedDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                      >
                        View Resume
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    )}
                    {generatedCoverLetterUrl && (
                      <a
                        href={generatedCoverLetterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold border border-slate-700 transition-all hover:scale-105"
                      >
                        View Cover Letter
                        <FileText className="w-5 h-5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => setStep("inputs")}
                    className="text-slate-500 hover:text-slate-300 text-sm"
                  >
                    Create Another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm sticky top-6">
              <div className="flex items-center gap-2 mb-6 text-slate-400 uppercase tracking-wider text-xs font-bold">
                <Settings className="w-4 h-4" />
                Configuration
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs font-medium text-slate-500 mb-1">Status</div>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    n8n Workflow Active
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs font-medium text-slate-500 mb-1">API Key</div>
                  <div className="text-xs text-slate-300 font-mono truncate">
                    Securely Managed (Server-Side)
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800">
                <button
                  onClick={handleGenerate}
                  disabled={step !== "inputs"}
                  className="w-full group relative overflow-hidden bg-white text-slate-950 rounded-xl py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {step === "inputs" ? "Generate Resume & Letter" : "Processing..."}
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-1 backdrop-blur-sm">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800/50">
        <Icon className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );
}
