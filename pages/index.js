import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [sessionKey, setSessionKey] = useState('');

  const sendQuery = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, session_key: sessionKey }),
    });
    const data = await res.json();
    setReply(data.reply || data.error || '');
    if (data.session_key) {
      setSessionKey(data.session_key);
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Synthea Chat</h1>
      <form onSubmit={sendQuery}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your message"
          style={{ width: '300px' }}
        />
        <button type="submit">Send</button>
      </form>
      {reply && (
        <p><strong>AI:</strong> {reply}</p>
      )}
    </main>
  );
}
