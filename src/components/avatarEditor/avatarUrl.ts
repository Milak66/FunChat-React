import type { SyntheticEvent } from "react";
import defaultAvatar from "../../assets/userIcon.jpg";

const SERVER = String(import.meta.env.VITE_SERVER_URL ?? "").replace(/\/$/, "");

/**
 * Turns whatever the server stored into a working image address:
 * - empty            → the default user icon
 * - full address     → used as it is (the server now saves "https://...")
 * - "/uploads/..."   → server address + path (older accounts)
 */
export function avatarUrl(path?: string | null): string {
  if (!path) {
    return defaultAvatar;
  }

  if (/^(https?:|blob:|data:)/.test(path)) {
    return path;
  }

  return `${SERVER}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** If an avatar file is missing on the server, show the default icon instead of a broken image. */
export function handleAvatarError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;

  if (img.dataset.fallback) {
    return;
  }

  img.dataset.fallback = "1";
  img.src = defaultAvatar;
}

export { defaultAvatar };