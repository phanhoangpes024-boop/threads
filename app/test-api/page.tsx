'use client';

import { useState } from 'react';

export default function TestAPI() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetThread = async () => {
    setLoading(true);
    // Lấy thread đầu tiên từ DB
    const res = await fetch('/api/threads');
    const threads = await res.json();
    const firstThreadId = threads[0]?.id;
    
    if (firstThreadId) {
      const detailRes = await fetch(`/api/threads/${firstThreadId}`);
      const data = await detailRes.json();
      setResult({ type: 'Single Thread', data });
    }
    setLoading(false);
  };

  const testGetComments = async () => {
    setLoading(true);
    const res = await fetch('/api/threads');
    const threads = await res.json();
    const firstThreadId = threads[0]?.id;
    
    if (firstThreadId) {
      const commentsRes = await fetch(`/api/threads/${firstThreadId}/comments`);
      const data = await commentsRes.json();
      setResult({ type: 'Comments', data });
    }
    setLoading(false);
  };

  const testPostComment = async () => {
    setLoading(true);
    const res = await fetch('/api/threads');
    const threads = await res.json();
    const firstThreadId = threads[0]?.id;
    
    if (firstThreadId) {
      const postRes = await fetch(`/api/threads/${firstThreadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: '05b1fe95-71bb-49df-a7ad-dccaf1d016f4',
          content: 'Test comment from API'
        }),
      });
      const data = await postRes.json();
      setResult({ type: 'New Comment', data });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test API Routes</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={testGetThread} disabled={loading}>
          Test GET Thread
        </button>
        <button onClick={testGetComments} disabled={loading}>
          Test GET Comments
        </button>
        <button onClick={testPostComment} disabled={loading}>
          Test POST Comment
        </button>
      </div>

      {loading && <p>Loading...</p>}
      
      {result && (
        <div>
          <h2>{result.type}</h2>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '8px',
            overflow: 'auto' 
          }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}