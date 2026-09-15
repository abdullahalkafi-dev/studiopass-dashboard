"use client";

import { useState } from "react";
import { ShieldAlert, X, Loader2, AlertTriangle } from "lucide-react";
import { useResetUser2FAMutation } from "@/features/auth/authApi";
import { toast } from "sonner";

interface Reset2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
  } | null;
}

export function Reset2FAModal({ isOpen, onClose, user }: Reset2FAModalProps) {
  const [resetUser2FA, { isLoading }] = useResetUser2FAMutation();

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    try {
      const res = await resetUser2FA(user.id).unwrap();
      toast.success(res?.message || `Two-Factor Authentication has been reset for ${user.fullName || "the user"}.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to reset Two-Factor Authentication.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Reset Two-Factor Authentication</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Administrative security override</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-muted/30 border border-border rounded-xl space-y-1.5">
            <div className="text-xs text-muted-foreground">Target User:</div>
            <div className="text-sm font-bold text-foreground">{user.fullName || "User"}</div>
            {user.email && <div className="text-xs text-muted-foreground font-mono">{user.email}</div>}
            {user.role && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                {user.role.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              Resetting 2FA will immediately remove the authenticator requirement for this account. The user will be required to configure a new authenticator app on their next login.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldAlert size={14} />}
            Confirm Reset 2FA
          </button>
        </div>
      </div>
    </div>
  );
}
