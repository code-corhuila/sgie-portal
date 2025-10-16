const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1/api').replace(/\/$/, '');

export interface ApiEnvelope<T> {
  status: boolean;
  data: T;
  message?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type UnauthorizedListener = (error: ApiError) => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

interface ApiCallOptions extends RequestInit {
  skipJson?: boolean;
}

const isFormData = (value: unknown): value is FormData => typeof FormData !== 'undefined' && value instanceof FormData;

const buildHeaders = (base: HeadersInit | undefined, body?: BodyInit | null) => {
  const headers = new Headers(base ?? {});
  if (body && !headers.has('Content-Type') && !isFormData(body)) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
};

const readPayload = async <T>(response: Response, skipJson: boolean): Promise<T> => {
  if (skipJson || response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (parseError) {
    throw new ApiError(response.status, 'Respuesta JSON inválida', { cause: parseError, raw });
  }
};

const notifyUnauthorized = (error: ApiError) => {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener(error);
    } catch (listenerError) {
      console.warn('Error en listener de sesión expirada', listenerError);
    }
  });
};

export async function apiCall<T = unknown>(endpoint: string, options: ApiCallOptions = {}): Promise<T> {
  const { skipJson = false, headers: baseHeaders, body, ...rest } = options;
  const headers = buildHeaders(baseHeaders, body);
  const config: RequestInit = {
    ...rest,
    body,
    credentials: rest.credentials ?? 'include',
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      if (response.status !== 204) {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : null;
      }
    } catch {
      errorData = null;
    }

    const message =
      errorData && typeof errorData === 'object' && 'message' in (errorData as Record<string, unknown>)
        ? String((errorData as { message?: unknown }).message)
        : `Error: ${response.status}`;

    const apiError = new ApiError(response.status, message, errorData);

    if (response.status === 401) {
      notifyUnauthorized(apiError);
    }

    throw apiError;
  }

  return readPayload<T>(response, skipJson);
}

export const unwrapApiEnvelope = <T>(payload: ApiEnvelope<T> | T): T =>
  (payload && typeof payload === 'object' && 'data' in payload ? (payload as ApiEnvelope<T>).data : payload) as T;
