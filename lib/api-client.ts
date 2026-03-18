export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.split("=")[1] ?? "");
}

type ApiFetchOptions = RequestInit & {
  /** ISR revalidate in seconds. Pass 0 for force-cache, omit for no-store (default). */
  revalidate?: number;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  const token = getCookieValue("tclass_token");
  const { revalidate, cache, ...fetchOptions } = options;

  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  // If revalidate is set, use Next.js ISR — otherwise fall back to no-store
  const nextOptions = revalidate !== undefined ? { next: { revalidate } } : {};
  const cacheOption = revalidate !== undefined ? undefined : (cache ?? "no-store");

  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    ...nextOptions,
    ...(cacheOption !== undefined ? { cache: cacheOption } : {}),
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (payload as { message?: string }).message ?? "Request failed.";
    throw new Error(message);
  }

  return payload;
}
