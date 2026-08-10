"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ImageModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageModal({ src, alt = "Profile Image", onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (src) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100 hover:scale-105 transition-all z-10 font-bold"
          title="Close"
          type="button"
        >
          <X size={18} />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
}
