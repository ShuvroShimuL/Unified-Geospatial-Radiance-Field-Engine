export class RagClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async query(lat, lon, queryText) {
    if (!this.token) {
      // Hardcode fallback as requested
      const username = import.meta.env.VITE_TEST_USERNAME ?? 'admin';
      const password = import.meta.env.VITE_TEST_PASSWORD ?? 'changeme';
      try {
        const loginRes = await fetch(`${this.baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (loginRes.ok) {
          const { token } = await loginRes.json();
          this.setToken(token);
        } else {
          throw new Error('Fallback authentication failed');
        }
      } catch (e) {
        throw new Error('Not authenticated and fallback failed: ' + e.message);
      }
    }

    const response = await fetch(`${this.baseUrl}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ lat, lon, query: queryText })
    });

    if (!response.ok) {
      throw new Error(`RAG query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}
