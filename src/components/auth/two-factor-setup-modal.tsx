"use client";

import { useState } from "react";
import { ShieldCheck, Copy, Check, Key, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorSetupModalProps {
  qrCode: string;
  secret: string;
  isLoading: boolean;
  onVerify: (code: string) => Promise<void>;
  isSettingsMode?: boolean;
}

export function TwoFactorSetupModal({
  qrCode,
  secret,
  isLoading,
  onVerify,
  isSettingsMode = false,
}: TwoFactorSetupModalProps) {
  const [code, setCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secret);
    setCopiedKey(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    await onVerify(code.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isSettingsMode ? "Set Up Two-Factor Authentication" : "Secure Your Account"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy.
        </p>
      </div>

      {/* QR Code & Secret */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 rounded-xl bg-muted/40 border border-border">
        {qrCode && (
          <div className="bg-white p-2.5 rounded-lg border border-border shadow-sm shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode}
              alt="2FA QR Code"
              className="w-36 h-36 object-contain"
            />
          </div>
        )}

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manual Entry Secret Key
          </span>
          <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
            <Key className="w-4 h-4 text-muted-foreground shrink-0" />
            <code className="text-xs font-mono font-bold text-foreground select-all break-all">
              {secret}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-auto"
              title="Copy secret key"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            If you cannot scan, enter this key manually in your authenticator app.
          </p>
        </div>
      </div>

      {/* Verification Code Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Enter 6-digit Authenticator Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#02B2FF] focus:border-transparent bg-background"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.trim().length !== 6}
          className="w-full bg-[#02B2FF] hover:bg-[#0290d6] text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md shadow-[#02B2FF]/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify & Enable
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
