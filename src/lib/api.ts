const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type TokenStore = {
  access: string | null;
  refresh: string | null;
};

const ACCESS_KEY = "ttm.accessToken";
const REFRESH_KEY = "ttm.refreshToken";

export const tokens = {
  read(): TokenStore {
    if (typeof window === "undefined") return { access: null, refresh: null };
    return {
      access: localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
    };
  },
  write(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function refreshAccess(): Promise<string | null> {
  const { refresh } = tokens.read();
  if (!refresh) return null;
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    tokens.clear();
    return null;
  }
  const data = await res.json();
  tokens.write(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const doFetch = async (token: string | null) => {
    return fetch(`${API}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string> | undefined),
      },
    });
  };

  let token = auth ? tokens.read().access : null;
  let res = await doFetch(token);
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccess();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details);
  }
  return body as T;
}
