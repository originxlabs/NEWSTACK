function normalizeInput(value: string): string {
  return value.trim().toLowerCase();
}

export async function createAnonymousFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(navigator.hardwareConcurrency || ""),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    String(screen.width),
    String(screen.height),
  ];

  const raw = normalizeInput(parts.join("|"));
  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
