// Backend API URL — set this to your deployed backend URL or localhost for development
const BASE_URL = 'https://to-do-backend-blush.vercel.app';

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  getTodos: (date?: string) =>
    request(`/api/todos${date ? `?date=${date}` : ''}`),
  getPendingPrevious: () =>
    request('/api/todos/pending-previous'),
  createTodo: (data: any) =>
    request('/api/todos', { method: 'POST', body: JSON.stringify(data) }),
  updateTodo: (id: string, data: any) =>
    request(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTodo: (id: string) =>
    request(`/api/todos/${id}`, { method: 'DELETE' }),
  moveToToday: (ids: string[]) =>
    request('/api/todos/move-to-today', { method: 'POST', body: JSON.stringify({ ids }) }),
  getVapidKey: () =>
    request('/api/push/vapid-public-key'),
  subscribePush: (sub: any) =>
    request('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
};
