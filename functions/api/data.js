async function ensureTable(env) {
  await env.DB.exec("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)")
}

export async function onRequestGet({ env }) {
  await ensureTable(env)
  const rows = await env.DB.prepare("SELECT key, value FROM kv").all()
  const data = {}
  for (const r of rows.results) {
    try { data[r.key] = JSON.parse(r.value) } catch (e) {}
  }
  return Response.json(data)
}

export async function onRequestPut({ request, env }) {
  await ensureTable(env)
  const body = await request.json()
  const stmt = env.DB.prepare(
    "INSERT INTO kv (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2"
  )
  const batch = Object.keys(body).map(k => stmt.bind(k, JSON.stringify(body[k])))
  if (batch.length) await env.DB.batch(batch)
  return Response.json({ ok: true })
}
