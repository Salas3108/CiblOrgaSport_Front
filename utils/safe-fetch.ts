// Minimal fetch wrapper with timeout and JSON parsing.
export type Json = Record<string, unknown>;

export async function safeFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; json: Json | null }> {
  const { timeoutMs = 15000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(rest.headers || {}),
      },
    });

    let data: Json | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return { ok: res.ok, status: res.status, json: data };
  } catch (err: any) {
    // Surface network/timeout errors in a consistent shape.
    return {
      ok: false,
      status: 0,
      json: { message: err?.name === "AbortError" ? "Request timed out" : err?.message || "Network error" },
    };
  } finally {
    clearTimeout(timer);
  }
}
