import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.includes(":9000/studiopass/")) {
    return path.replace(/^http:\/\/[^/]+:9000\/studiopass\//, "https://joura.info/studiopass/");
  }
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL || "https://joura.info/studiopass";
  return `${minioUrl}/${path}`;
}
