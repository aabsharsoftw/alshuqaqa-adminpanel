import type {
  Enquiry,
  Lang,
  Listing,
  ListingStatus,
  Landlord,
  LoginResponse,
  Paginated,
  User,
} from './types';

const BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

const TOKEN_KEY = 'rental-admin.token';
const LANG_KEY = 'rental-admin.lang';

export const UNAUTHORIZED_EVENT = 'rental-admin:unauthorized';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const langStore = {
  get: (): Lang => (localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en'),
  set: (lang: Lang) => localStorage.setItem(LANG_KEY, lang),
};

type Query = Record<string, string | number | undefined>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Nest surfaces validation failures as a string[]; flatten to one line. */
function extractMessage(body: unknown, fallback: string) {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Query;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;

  const headers: Record<string, string> = {
    'Accept-Language': langStore.get(),
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection.');
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  const parsed: unknown = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    if (response.status === 401 && auth) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      response.status,
      extractMessage(parsed, `Request failed (${response.status}).`),
    );
  }

  return parsed as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  me: () => request<User>('/auth/me'),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  listings: (params: { status?: ListingStatus; page?: number; limit?: number }) =>
    request<Paginated<Listing>>('/admin/listings', { query: { ...params } }),

  approveListing: (id: string) =>
    request<Listing>(`/admin/listings/${id}/approve`, { method: 'PATCH' }),

  rejectListing: (id: string, reason?: string) =>
    request<Listing>(`/admin/listings/${id}/reject`, {
      method: 'PATCH',
      body: reason ? { reason } : {},
    }),

  deleteListing: (id: string) =>
    request<{ success: boolean }>(`/listings/${id}`, { method: 'DELETE' }),

  landlords: () => request<Landlord[]>('/admin/landlords'),

  approveLandlord: (id: string) =>
    request<User>(`/admin/landlords/${id}/approve`, { method: 'PATCH' }),

  enquiries: (params: { page?: number; limit?: number }) =>
    request<Paginated<Enquiry>>('/admin/enquiries', { query: { ...params } }),
};
