import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;

  // If path is full URL with raw IP or HTTP port 9000, rewrite host to domain HTTPS proxy
  if (path.startsWith("http")) {
    if (path.includes(":9000/studiopass/")) {
      return path.replace(/^http:\/\/[^/]+:9000\/studiopass\//, "https://joura.info/studiopass/");
    }
    if (path.includes("72.60.26.180")) {
      return path.replace(/^http:\/\/72\.60\.26\.180(:9000)?\//, "https://joura.info/");
    }
    if (typeof window !== "undefined" && window.location.protocol === "https:" && path.startsWith("http://")) {
      return path.replace(/^http:\/\//, "https://");
    }
    return path;
  }

  // Strip leading "studiopass/" or "/" if present to prevent double pathing
  const cleanPath = path.startsWith("studiopass/")
    ? path.replace(/^studiopass\//, "")
    : path.replace(/^\//, "");

  const baseUrl = typeof window !== "undefined" && window.location.origin.includes("joura.info")
    ? "https://joura.info/studiopass"
    : process.env.NEXT_PUBLIC_MINIO_URL || "https://joura.info/studiopass";

  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}/${cleanPath}`;
}
