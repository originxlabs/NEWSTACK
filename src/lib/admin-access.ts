const DEFAULT_ADMIN_EMAILS = ["hello@abhishekpanda.com", "hello.abhishekpanda.com"];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeAlias(email: string): string | null {
  if (email.includes("@")) {
    return email.replace("@", ".");
  }
  const dotIdx = email.indexOf(".");
  if (dotIdx <= 0) return null;
  return `${email.slice(0, dotIdx)}@${email.slice(dotIdx + 1)}`;
}

function parseConfiguredAdminEmails(): string[] {
  const raw = import.meta.env.VITE_ENTERPRISE_ADMIN_EMAILS as string | undefined;
  const configured = raw
    ?.split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);

  if (!configured?.length) return DEFAULT_ADMIN_EMAILS;
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...configured]));
}

const ADMIN_EMAIL_SET = new Set(parseConfiguredAdminEmails().map(normalizeEmail));

export const DESIGNATED_ENTERPRISE_ADMIN_EMAILS = Array.from(ADMIN_EMAIL_SET);

export function isDesignatedEnterpriseAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  if (ADMIN_EMAIL_SET.has(normalized)) return true;

  const alias = normalizeAlias(normalized);
  return alias ? ADMIN_EMAIL_SET.has(alias) : false;
}

