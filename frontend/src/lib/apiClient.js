// Thin fetch wrapper around the FastAPI backend (see backend/app/main.py).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function buildUrl(path, params) {
  const url = new URL(path.replace(/^\//, ""), `${API_BASE_URL}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function request(path, { method = "GET", params, body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload.detail === "string") {
        detail = payload.detail;
      } else if (Array.isArray(payload.detail)) {
        detail = payload.detail.map((d) => d.msg).join(", ");
      }
    } catch {
      // response body wasn't JSON — fall back to the generic message above
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const apiClient = {
  get: (path, params, token) => request(path, { method: "GET", params, token }),
  post: (path, body, token) => request(path, { method: "POST", body, token }),
};