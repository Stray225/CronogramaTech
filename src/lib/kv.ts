/**
 * Thin wrapper around Vercel KV (Upstash Redis REST API).
 * Falls back to an in-memory Map when env vars are absent (dev / no KV set up).
 *
 * Set up Vercel KV:
 *  1. Vercel dashboard → Storage → Create → KV → Connect to project
 *  2. Run `vercel env pull .env.local` to get the env vars locally
 *
 * Required env vars (auto-set by Vercel after connecting):
 *  KV_REST_API_URL
 *  KV_REST_API_TOKEN
 */

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// ── In-memory fallback ────────────────────────────────────────────────────────
// Survives the lifetime of the server process but resets on redeploy / restart.
// Perfectly fine for local dev; set up KV for production persistence.
const mem = new Map<string, string>();

async function memGet<T>(key: string): Promise<T | null> {
  const raw = mem.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function memSet(key: string, value: unknown): Promise<void> {
  mem.set(key, JSON.stringify(value));
}

async function memKeys(prefix: string): Promise<string[]> {
  return [...mem.keys()].filter((k) => k.startsWith(prefix));
}

// ── Upstash REST API ──────────────────────────────────────────────────────────
// Command format: POST {url}  body: ["COMMAND", "arg1", "arg2", ...]
async function upstashCmd(commands: unknown[]): Promise<unknown> {
  const res = await fetch(KV_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV HTTP ${res.status}`);
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

async function kvGet<T>(key: string): Promise<T | null> {
  const raw = (await upstashCmd(["GET", key])) as string | null;
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  await upstashCmd(["SET", key, JSON.stringify(value)]);
}

async function kvKeys(prefix: string): Promise<string[]> {
  const result = await upstashCmd(["KEYS", `${prefix}*`]);
  return Array.isArray(result) ? (result as string[]) : [];
}

// ── Public API ────────────────────────────────────────────────────────────────

const useKv = !!(KV_URL && KV_TOKEN);

export async function kvGetSchedule<T>(id: string): Promise<T | null> {
  const key = `schedule:${id}`;
  return useKv ? kvGet<T>(key) : memGet<T>(key);
}

export async function kvSetSchedule(id: string, value: unknown): Promise<void> {
  const key = `schedule:${id}`;
  return useKv ? kvSet(key, value) : memSet(key, value);
}

export async function kvListScheduleIds(): Promise<string[]> {
  const prefix = "schedule:";
  const keys = useKv ? await kvKeys(prefix) : await memKeys(prefix);
  return keys.map((k) => k.replace(prefix, ""));
}
