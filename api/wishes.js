// Anonymous wish wall. Storage: Upstash Redis added from the Vercel dashboard (Storage tab).
// GET  /api/wishes -> [{ text, t }] newest first (max 100)
// POST /api/wishes -> { text } adds a wish. 3-280 chars, no links or phone numbers, 1 per minute per visitor.
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEEP = 100;

async function redis(commands) {
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error('store');
  return r.json();
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'not_connected' });
  try {
    if (req.method === 'GET') {
      const out = await redis([['LRANGE', 'wishes', 0, KEEP - 1]]);
      const list = (out[0].result || []).map((s) => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
      return res.status(200).json(list);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const text = String(body.text || '').replace(/\s+/g, ' ').trim();
      if (Array.from(text).length < 3 || Array.from(text).length > 280) return res.status(400).json({ error: 'length' });
      if (/https?:|www\.|\.(com|in|net|org)\b|@|\d{8,}/i.test(text)) return res.status(400).json({ error: 'private' });
      const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || 'x').split(',')[0].trim();
      const key = 'rl:' + crypto.createHash('sha256').update(ip + 'chhath').digest('hex').slice(0, 24);
      const lock = await redis([['SET', key, '1', 'EX', 60, 'NX']]);
      if (!lock[0].result) return res.status(429).json({ error: 'slow' });
      await redis([['LPUSH', 'wishes', JSON.stringify({ text, t: Date.now() })], ['LTRIM', 'wishes', 0, KEEP - 1]]);
      return res.status(201).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
