"use client";

const DEVICE_ID_KEY = "studio_device_id";
const DEVICE_NAME_KEY = "studio_device_name";

/**
 * Retrieves the persistent cryptographic device ID from localStorage,
 * or creates and stores one if none exists.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-rendering";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "unsupported-storage";
  }
}

/**
 * Detects client operating system from navigator.
 */
export function detectOS(): string {
  if (typeof window === "undefined") return "Unknown OS";
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/ipad|iphone|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown OS";
}

/**
 * Detects client browser from navigator.
 */
export function detectBrowser(): string {
  if (typeof window === "undefined") return "Unknown Browser";
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Browser";
}

/**
 * Returns full device metadata for registration & session tracking.
 */
export function getDeviceMetadata(): {
  deviceId: string;
  deviceName: string;
  os: string;
  browser: string;
} {
  const deviceId = getOrCreateDeviceId();
  const os = detectOS();
  const browser = detectBrowser();

  let deviceName = "";
  if (typeof window !== "undefined") {
    try {
      deviceName = localStorage.getItem(DEVICE_NAME_KEY) || "";
    } catch {}
  }

  if (!deviceName) {
    deviceName = `${os} Workstation (${browser})`;
  }

  return {
    deviceId,
    deviceName,
    os,
    browser,
  };
}

/**
 * Allows the studio operator to give this workstation a custom label (e.g. "Studio Booth 1").
 */
export function setCustomDeviceName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEVICE_NAME_KEY, name.trim());
  } catch {}
}
