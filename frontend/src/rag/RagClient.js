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
      throw new Error('Not authenticated');
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
