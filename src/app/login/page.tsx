"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/features/auth/authApi";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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
        toast.success("Welcome back!");
        router.push("/");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">StudioPass</h1>
          <p className="text-muted-foreground mt-2">
            Station Management Dashboard
          </p>
        </div>
        <div className="bg-card rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Sign in to your account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent text-sm"
                disabled={isLoading}
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
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent text-sm pr-10"
                  disabled={isLoading}
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
              disabled={isLoading}
              className="w-full bg-[#02B2FF] hover:bg-[#0290d6] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-muted-foreground text-xs mt-6">
          StudioPass v1.0 — Multi-Tenant Station Management
        </p>
      </div>
    </div>
  );
}
