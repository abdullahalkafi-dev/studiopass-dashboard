"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useLoginMutation,
  useVerify2FALoginMutation,
  useSetup2FAEnableMutation,
  useSkip2FASetupMutation,
} from "@/features/auth/authApi";
import { Eye, EyeOff, Loader2, User, Lock, Headphones } from "lucide-react";
import { toast } from "sonner";
import { TwoFactorSetupModal } from "@/components/auth/two-factor-setup-modal";
import { TwoFactorVerifyModal } from "@/components/auth/two-factor-verify-modal";
import { LoginCustomerCareModal } from "@/components/modals/login-customer-care-modal";

type LoginStep = "credentials" | "setup_2fa" | "verify_2fa";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customerCareOpen, setCustomerCareOpen] = useState(false);

  // 2FA session states
  const [tempToken, setTempToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Mutations
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [verify2FALogin, { isLoading: isVerifying2FA }] = useVerify2FALoginMutation();
  const [setup2FAEnable, { isLoading: isEnabling2FA }] = useSetup2FAEnableMutation();
  const [skip2FASetup, { isLoading: isSkipping2FA }] = useSkip2FASetupMutation();

  const router = useRouter();

  // 1. Initial Username + Password Submission
  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all compulsory fields");
      return;
    }
    try {
      const result = await login({
        username: username.trim(),
        password: password.trim(),
      }).unwrap();

      if (result.success) {
        // Case A: 2FA is already enabled on this account -> verify 6 digits
        if (result.data?.requires2FA) {
          setTempToken(result.data.tempToken);
          setStep("verify_2fa");
          return;
        }

        // Case B: 2FA is not enabled yet -> prompt setup with skip option
        if (result.data?.requires2FASetup) {
          setTempToken(result.data.tempToken);
          setQrCode(result.data.qrCode);
          setSecret(result.data.secret);
          setRecoveryCodes(result.data.recoveryCodes || []);
          setStep("setup_2fa");
          return;
        }

        // Case C: Direct token return
        toast.success("Welcome back!");
        router.push("/");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid username or password");
    }
  };

  // 2. Verifying existing 2FA code during login
  const handleVerify2FALogin = async (code: string) => {
    try {
      const result = await verify2FALogin({
        tempToken,
        code,
      }).unwrap();

      if (result.success) {
        toast.success("Welcome back!");
        router.push("/");
      } else {
        toast.error(result.message || "Verification failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid authenticator code");
    }
  };

  // 3. Verifying and Enabling 2FA on initial setup
  const handleEnable2FASetup = async (code: string) => {
    try {
      const result = await setup2FAEnable({
        tempToken,
        code,
        recoveryCodes,
      }).unwrap();

      if (result.success) {
        toast.success("Two-Factor Authentication enabled! Welcome!");
        router.push("/");
      } else {
        toast.error(result.message || "Setup verification failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid code. Please try again");
    }
  };

  // 4. Skipping 2FA Setup
  const handleSkip2FASetup = async () => {
    try {
      const result = await skip2FASetup({
        tempToken,
      }).unwrap();

      if (result.success) {
        toast.success("Welcome to StudioPass!");
        router.push("/");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Session expired. Please log in again");
      setStep("credentials");
    }
  };

  const handleBackToLogin = () => {
    setStep("credentials");
    setPassword("");
    setTempToken("");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#090E1A] antialiased">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl bg-[#0F172A] grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* LEFT BRANDING HERO (Col span 6 or 7) */}
        <div className="lg:col-span-6 relative overflow-hidden bg-gradient-to-br from-[#061026] via-[#081B3E] to-[#030914] p-8 sm:p-10 flex flex-col justify-between text-white border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Subtle audio wave background decoration */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 500 500" fill="none" preserveAspectRatio="none">
              <path
                d="M-50,250 C100,150 200,350 350,250 C450,180 500,300 550,250"
                stroke="#02B2FF"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M-50,300 C120,200 220,400 370,300 C470,220 520,320 570,290"
                stroke="#0080FF"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M-50,200 C80,100 180,300 330,200 C430,140 480,260 530,210"
                stroke="#38BDF8"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          </div>

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#02B2FF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[#02B2FF]/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path
                    d="M4 10V14M8 6V18M12 3V21M16 7V17M20 10V14"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white font-sans">
                  Studio<span className="text-[#02B2FF]">Pass</span>
                </span>
                <p className="text-[10px] text-sky-200/70 font-medium tracking-wide">
                  Connect. Engage. Be Heard.
                </p>
              </div>
            </div>
          </div>

          {/* Hero Visual: Headphones & Phone */}
          <div className="relative z-10 my-8 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-sky-500/20 bg-gradient-to-b from-[#0B214D]/60 to-transparent flex items-center justify-center">
              {/* Fallback & Image Layer */}
              <div className="absolute inset-0 bg-radial from-[#02B2FF]/20 to-transparent pointer-events-none" />
              <img
                src="/login-hero.png"
                alt="StudioPass Audience Engagement"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // If image load fails, hide img and show vector fallback
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              {/* Central Glowing Icon Fallback if image not rendered */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none opacity-0 only:opacity-100">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#02B2FF] to-[#0055FF] flex items-center justify-center shadow-xl shadow-[#02B2FF]/40 animate-pulse">
                  <Headphones size={36} className="text-white" />
                </div>
                <p className="text-sm font-bold text-white tracking-wide">Broadcast Audio & Media</p>
              </div>
            </div>
          </div>

          {/* Bottom Branding Text */}
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              The Engagement Platform for Radio, TV & Channels
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Connect with your audience in real-time through messages, calls, polls, challenges and more.
            </p>
          </div>
        </div>

        {/* RIGHT FORM CONTAINER (Col span 6) */}
        <div className="lg:col-span-6 bg-card p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {step === "credentials" && (
              <div className="max-w-sm mx-auto space-y-7">
                {/* Form Header */}
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Sign in to manage stations, podcasts, and analytics in one powerful dashboard.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitCredentials} className="space-y-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      Username <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent transition-all"
                        disabled={isLoggingIn}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                      Password <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 bg-muted/30 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent transition-all"
                        disabled={isLoggingIn}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full mt-2 bg-gradient-to-r from-[#02B2FF] to-[#0090FF] hover:from-[#009EE6] hover:to-[#007AE6] text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[#02B2FF]/20 hover:shadow-xl hover:shadow-[#02B2FF]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  {/* Contact Customer Care */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCustomerCareOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#02B2FF] hover:text-[#029BDC] font-medium transition-colors hover:underline"
                    >
                      <Headphones size={13} />
                      Contact Customer Care
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step: Setup 2FA */}
            {step === "setup_2fa" && (
              <div className="max-w-sm mx-auto">
                <TwoFactorSetupModal
                  qrCode={qrCode}
                  secret={secret}
                  recoveryCodes={recoveryCodes}
                  isLoading={isEnabling2FA || isSkipping2FA}
                  onVerify={handleEnable2FASetup}
                  onSkip={handleSkip2FASetup}
                />
              </div>
            )}

            {/* Step: Verify 2FA */}
            {step === "verify_2fa" && (
              <div className="max-w-sm mx-auto">
                <TwoFactorVerifyModal
                  isLoading={isVerifying2FA}
                  onVerify={handleVerify2FALogin}
                  onBackToLogin={handleBackToLogin}
                />
              </div>
            )}
          </div>

          {/* Footer Branding Note */}
          <div className="mt-8 pt-4 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground font-mono">
              © StudioPass 2026, Next Go Tech
            </p>
          </div>
        </div>
      </div>

      {/* Customer Care Interactive Modal */}
      <LoginCustomerCareModal
        open={customerCareOpen}
        onClose={() => setCustomerCareOpen(false)}
      />
    </div>
  );
}
