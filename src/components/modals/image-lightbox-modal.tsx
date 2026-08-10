"use client";

import { X, Download, ExternalLink } from "lucide-react";
import { resolveUrl } from "@/lib/utils";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  src?: string | null;
  title?: string;
}

export function ImageLightboxModal({ isOpen, onClose, src, title }: ImageLightboxModalProps) {
  if (!isOpen || !src) return null;

  const resolved = resolveUrl(src);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar controls */}
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-between text-white/90 px-1">
          <span className="text-sm font-medium truncate max-w-md">{title || "Image Preview"}</span>
          <div className="flex items-center gap-2">
            {resolved && (
              <a
                href={resolved}
                target="_blank"
                rel="noreferrer"
                download
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Open original image"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/50 max-h-[80vh] flex items-center justify-center">
          <img
            src={resolved || ""}
            alt={title || "Preview"}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
