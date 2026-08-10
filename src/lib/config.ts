/**
 * API configuration.
 * In development: calls localhost directly.
 * In production (Vercel): calls the Cloudflare tunnel URL to your Mac.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

// When empty string, fetches are relative (works for both local dev and when API is co-located)
// When set to a tunnel URL, fetches go to your Mac's local API through the tunnel
