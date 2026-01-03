// Centralized env accessor for client-side usage.
// Make sure to define NEXT_PUBLIC_API_BASE_URL in your .env.local, e.g.:
// NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com

export function getApiBaseUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return url;
}

export function assertApiBaseUrlOrThrow() {
  const url = getApiBaseUrl();
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL. Define it in .env.local and restart the dev server.");
  }
  return url;
}
