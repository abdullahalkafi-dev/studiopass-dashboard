"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/** Shown instead of a page the signed-in role / station type does not use (same look as the Challenges notice) */
export function FeatureUnavailable({
  title,
  message,
  backHref,
  backLabel,
}: {
  title: string;
  message: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border shadow-sm text-center my-8">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
        <ShieldAlert size={24} />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      {backHref && (
        <Link
          href={backHref}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors"
        >
          {backLabel || "Go back"}
        </Link>
      )}
    </div>
  );
}
