"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useLoginMutation,
  useVerify2FALoginMutation,
  useSetup2FAEnableMutation,
  useSkip2FASetupMutation,
} from "@/features/auth/authApi";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TwoFactorSetupModal } from "@/components/auth/two-factor-setup-modal";
import { TwoFactorVerifyModal } from "@/components/auth/two-factor-verify-modal";

type LoginStep = "credentials" | "setup_2fa" | "verify_2fa";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      toast.error("Please fill in all fields");
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

        // Case C: Non-dashboard or direct token return
        toast.success("Welcome back!");
        router.push("/");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid credentials");
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
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <div className={`w-full mx-4 transition-all duration-300 ${step === "setup_2fa" ? "max-w-lg" : "max-w-md"}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">StudioPass</h1>
          <p className="text-muted-foreground mt-2">
            Station Management Dashboard
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          {step === "credentials" && (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Sign in to your account
              </h2>
              <form onSubmit={handleSubmitCredentials} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent text-sm bg-background"
                    disabled={isLoggingIn}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent text-sm pr-10 bg-background"
                      disabled={isLoggingIn}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#02B2FF] hover:bg-[#0290d6] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </>
          )}

          {step === "setup_2fa" && (
            <TwoFactorSetupModal
              qrCode={qrCode}
              secret={secret}
              recoveryCodes={recoveryCodes}
              isLoading={isEnabling2FA || isSkipping2FA}
              onVerify={handleEnable2FASetup}
              onSkip={handleSkip2FASetup}
            />
          )}

          {step === "verify_2fa" && (
            <TwoFactorVerifyModal
              isLoading={isVerifying2FA}
              onVerify={handleVerify2FALogin}
              onBackToLogin={handleBackToLogin}
            />
          )}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          StudioPass v1.0 — Multi-Tenant Station Management
        </p>
      </div>
    </div>
  );
}
