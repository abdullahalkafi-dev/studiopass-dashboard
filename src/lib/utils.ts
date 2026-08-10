import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
    return path.replace(/^http:\/\//, "https://");
  }
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000";
  let fullUrl = `${minioUrl}/${path}`;
  if (fullUrl.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
    fullUrl = fullUrl.replace(/^http:\/\//, "https://");
  }
  return fullUrl;
}
