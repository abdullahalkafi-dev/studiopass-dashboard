"use client";

import { X, Headphones, Mail, Phone, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginCustomerCareModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginCustomerCareModal({ open, onClose }: LoginCustomerCareModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#02B2FF]/10 text-[#02B2FF]">
              <Headphones size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">StudioPass Customer Care</h3>
              <p className="text-xs text-muted-foreground">Authorized platform support & administrative assistance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            StudioPass accounts are provisioned exclusively through authorized network administration. If you have trouble signing in, resetting authentication, or need access credentials, please contact our support team.
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Mail size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Administrative Email Support</p>
                <a
                  href="mailto:support@studiopass.com"
                  className="text-[#02B2FF] hover:underline font-mono text-[11px]"
                >
                  support@studiopass.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="p-2 rounded-lg bg-[#02B2FF]/10 text-[#02B2FF]">
                <Phone size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Dedicated Helpline</p>
                <p className="text-muted-foreground font-mono text-[11px]">+256 700 000 000 / +880 1700 000000</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Operating Support Hours</p>
                <p className="text-muted-foreground text-[11px]">Mon – Sat: 08:00 AM – 10:00 PM (EAT / BST)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="bg-[#02B2FF] hover:bg-[#029BDC] text-white text-xs font-semibold px-5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
