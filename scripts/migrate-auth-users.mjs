#!/usr/bin/env node

import fs from "node:fs/promises";

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || "https://cpdxgnrpboreraiwcqgl.supabase.co";
const NEW_SERVICE_ROLE_KEY = process.env.NEW_SERVICE_ROLE_KEY;
const DRY_RUN = (process.env.DRY_RUN ?? "true").toLowerCase() === "true";
const PER_PAGE = Number(process.env.PER_PAGE ?? 1000);
const OUT_FILE = process.env.AUTH_USERS_EXPORT_FILE || "supabase/migration-bundle/auth_users_export.json";

function required(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

required("OLD_SUPABASE_URL", OLD_SUPABASE_URL);
required("OLD_SERVICE_ROLE_KEY", OLD_SERVICE_ROLE_KEY);
required("NEW_SERVICE_ROLE_KEY", NEW_SERVICE_ROLE_KEY);

const oldHeaders = {
  apikey: OLD_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${OLD_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

const newHeaders = {
  apikey: NEW_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${NEW_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function listOldUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const url = `${OLD_SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${PER_PAGE}`;
    const data = await fetchJson(url, { headers: oldHeaders });
    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < PER_PAGE) break;
    page += 1;
  }

  return users;
}

function randomPassword() {
  return `Tmp_${crypto.randomUUID()}_A1!`;
}

function toCreatePayload(user) {
  return {
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    email_confirm: Boolean(user.email_confirmed_at),
    phone_confirm: Boolean(user.phone_confirmed_at),
    user_metadata: user.user_metadata ?? {},
    app_metadata: user.app_metadata ?? {},
    banned_until: user.banned_until ?? undefined,
    password: randomPassword(),
  };
}

async function createUserOnNew(user) {
  const payload = toCreatePayload(user);
  if (!payload.email && !payload.phone) {
    return { status: "skipped", reason: "no_email_or_phone" };
  }

  if (DRY_RUN) return { status: "dry_run" };

  const url = `${NEW_SUPABASE_URL}/auth/v1/admin/users`;
  try {
    await fetchJson(url, {
      method: "POST",
      headers: newHeaders,
      body: JSON.stringify(payload),
    });
    return { status: "created" };
  } catch (err) {
    const msg = String(err);
    if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
      return { status: "exists" };
    }
    return { status: "error", reason: msg };
  }
}

async function main() {
  console.log(`Starting auth user migration fallback. DRY_RUN=${DRY_RUN}`);
  const users = await listOldUsers();
  console.log(`Fetched ${users.length} users from old project.`);

  const report = {
    generated_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    old_url: OLD_SUPABASE_URL,
    new_url: NEW_SUPABASE_URL,
    total: users.length,
    created: 0,
    exists: 0,
    skipped: 0,
    errors: 0,
    results: [],
  };

  for (const user of users) {
    const result = await createUserOnNew(user);
    report.results.push({
      id: user.id,
      email: user.email,
      phone: user.phone,
      result,
    });

    if (result.status === "created") report.created += 1;
    else if (result.status === "exists") report.exists += 1;
    else if (result.status === "skipped" || result.status === "dry_run") report.skipped += 1;
    else report.errors += 1;
  }

  await fs.mkdir("supabase/migration-bundle", { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(report, null, 2));

  console.log(`Auth migration report written: ${OUT_FILE}`);
  console.log(`Summary: total=${report.total} created=${report.created} exists=${report.exists} skipped=${report.skipped} errors=${report.errors}`);

  if (!DRY_RUN) {
    console.log("Next: trigger password reset / magic link flow for migrated users.");
  }
}

main().catch((err) => {
  console.error("Auth migration failed:", err);
  process.exit(1);
});
