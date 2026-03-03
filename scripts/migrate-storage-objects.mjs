#!/usr/bin/env node

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SERVICE_ROLE_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || "https://cpdxgnrpboreraiwcqgl.supabase.co";
const NEW_SERVICE_ROLE_KEY = process.env.NEW_SERVICE_ROLE_KEY;
const DRY_RUN = (process.env.DRY_RUN ?? "true").toLowerCase() === "true";

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
};

const newHeaders = {
  apikey: NEW_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${NEW_SERVICE_ROLE_KEY}`,
};

function encodeObjectPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  return data;
}

async function listBuckets(baseUrl, headers) {
  return fetchJson(`${baseUrl}/storage/v1/bucket`, { headers });
}

async function ensureBucket(bucket) {
  if (DRY_RUN) return;

  const payload = {
    id: bucket.id,
    name: bucket.name,
    public: Boolean(bucket.public),
    file_size_limit: bucket.file_size_limit ?? null,
    allowed_mime_types: bucket.allowed_mime_types ?? null,
    avif_autodetection: Boolean(bucket.avif_autodetection),
  };

  const res = await fetch(`${NEW_SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...newHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) return;
  if (res.status === 409) return;

  const body = await res.text();
  throw new Error(`Bucket create failed for ${bucket.name}: ${res.status} ${body}`);
}

async function listObjectsRecursive(bucketId, prefix = "") {
  const objects = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const batch = await fetchJson(`${OLD_SUPABASE_URL}/storage/v1/object/list/${bucketId}`, {
      method: "POST",
      headers: { ...oldHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix,
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });

    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const item of batch) {
      const itemName = prefix ? `${prefix}${item.name}` : item.name;
      const isFolder = !item.id && item.metadata == null;
      if (isFolder) {
        const childPrefix = `${itemName}/`;
        const nested = await listObjectsRecursive(bucketId, childPrefix);
        objects.push(...nested);
      } else {
        objects.push(itemName);
      }
    }

    if (batch.length < limit) break;
    offset += limit;
  }

  return objects;
}

async function copyObject(bucketId, objectPath) {
  if (DRY_RUN) return;

  const encodedPath = encodeObjectPath(objectPath);
  const fromRes = await fetch(`${OLD_SUPABASE_URL}/storage/v1/object/${bucketId}/${encodedPath}`, {
    headers: oldHeaders,
  });

  if (!fromRes.ok) {
    const text = await fromRes.text();
    throw new Error(`Download failed ${bucketId}/${objectPath}: ${fromRes.status} ${text}`);
  }

  const contentType = fromRes.headers.get("content-type") || "application/octet-stream";
  const body = await fromRes.arrayBuffer();

  const toRes = await fetch(`${NEW_SUPABASE_URL}/storage/v1/object/${bucketId}/${encodedPath}`, {
    method: "POST",
    headers: {
      ...newHeaders,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body,
  });

  if (!toRes.ok) {
    const text = await toRes.text();
    throw new Error(`Upload failed ${bucketId}/${objectPath}: ${toRes.status} ${text}`);
  }
}

async function main() {
  console.log(`Starting storage migration. DRY_RUN=${DRY_RUN}`);

  const buckets = await listBuckets(OLD_SUPABASE_URL, oldHeaders);
  console.log(`Found ${buckets.length} buckets on source project.`);

  let copied = 0;
  for (const bucket of buckets) {
    console.log(`Bucket: ${bucket.name}`);
    await ensureBucket(bucket);

    const objects = await listObjectsRecursive(bucket.id);
    console.log(`  Objects discovered: ${objects.length}`);

    for (const objectPath of objects) {
      await copyObject(bucket.id, objectPath);
      copied += 1;
      if (copied % 50 === 0) {
        console.log(`  Progress copied=${copied}`);
      }
    }
  }

  console.log(`Storage migration complete. Buckets=${buckets.length} Objects=${copied}`);
}

main().catch((err) => {
  console.error("Storage migration failed:", err);
  process.exit(1);
});
