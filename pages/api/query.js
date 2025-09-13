const store = new Map();
const requestTracker = new Map();
const RATE_LIMIT = 10; // requests per minute

function isRateLimited(sessionKey) {
  const now = Date.now();
  if (!requestTracker.has(sessionKey)) {
    requestTracker.set(sessionKey, []);
  }
  const timestamps = requestTracker.get(sessionKey);
  while (timestamps.length && timestamps[0] < now - 60000) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT) {
    return true;
  }
  timestamps.push(now);
  return false;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { query = '', session_key = 'default_session' } = req.body || {};
  const trimmed = query.trim();
  if (!trimmed) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (isRateLimited(session_key)) {
    return res
      .status(429)
      .json({ error: 'You have exceeded more than 10 requests per minute. Please try again later.' });
  }

  if (!store.has(session_key)) {
    store.set(session_key, []);
  }
  const history = store.get(session_key);
  history.push({ role: 'user', content: trimmed });

  const reply = `You said: ${trimmed}`;
  history.push({ role: 'assistant', content: reply });

  return res.status(200).json({ reply, session_key });
}
