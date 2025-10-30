export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8080/v1/api"
).replace(/\/$/, "");

const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";
const CSRF_FALLBACK_PATTERN = /(XSRF|CSRF)[-_]?TOKEN/i;
const CSRF_REFRESH_ENDPOINT = "/usuario/me"; // NUEVO: Endpoint protegido que fuerza a Spring a emitir la cookie CSRF.

const withLeadingSlash = (endpoint: string): string =>
  endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

export const buildApiUrl = (endpoint: string): string =>
  `${API_BASE_URL}${withLeadingSlash(endpoint)}`;

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

const sanitizeCookieValue = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;
  try {
    return decodeURIComponent(unquoted);
  } catch {
    return unquoted;
  }
};

/* ANTIGUO: Guardaba manualmente el CSRF en la cookie desde el front, ya no se utiliza.
const storeCsrfToken = (token: string | null): string | null => {
  if (!token || typeof document === "undefined") {
    return token;
  }

  const secureAttributes =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Path=/; SameSite=None; Secure"
      : "; Path=/; SameSite=Lax";

  document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(
    token,
  )}${secureAttributes}`;
  return token;
};
*/

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const source = document.cookie;
  if (!source) {
    return null;
  }

  const entries = source
    .split(";")
    .map((token) => token.trim())
    .filter(Boolean);

  let fallback: string | null = null;

  for (const entry of entries) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1);
    const sanitized = sanitizeCookieValue(value);
    if (!sanitized) {
      continue;
    }

    if (key === name) {
      return sanitized;
    }

    if (!fallback && CSRF_FALLBACK_PATTERN.test(key)) {
      fallback = sanitized;
    }
  }

  return fallback;
};

const requiresCsrfHeader = (method: string): boolean =>
  ["POST", "PUT", "PATCH", "DELETE"].includes(method);

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const buildHeaders = (
  base: HeadersInit | undefined,
  body?: BodyInit | null,
) => {
  const headers = new Headers(base ?? {});
  if (body && !headers.has("Content-Type") && !isFormData(body)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
};

/* ANTIGUO: Generaba tokens CSRF aleatorios en el cliente, ya no se permite.
const generateCsrfToken = (): string => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    if (typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }
  }

  return `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
};
*/

let csrfPromise: Promise<string | null> | null = null;

const fetchCsrfTokenFromServer = async (): Promise<string | null> => {
  // NUEVO: Dispara un GET protegido para que Spring Security rote/emita el token CSRF.
  const response = await fetch(buildApiUrl(CSRF_REFRESH_ENDPOINT), {
    credentials: "include",
    method: "GET",
  });

  if (!response.ok && response.status !== 401 && response.status !== 403) {
    throw new ApiError(
      response.status,
      "No se pudo inicializar el token CSRF",
      null,
    );
  }

  const refreshed = getCookie(CSRF_COOKIE_NAME);
  if (refreshed) {
    return refreshed;
  }

  if (!response.ok) {
    // NUEVO: Si no llegó cookie en un error 401/403, propagamos el error original.
    throw new ApiError(
      response.status,
      "Sesión inválida al solicitar CSRF",
      null,
    );
  }

  return null;
};

export const refreshCsrfToken = async (): Promise<string | null> => {
  // NUEVO: Expone un refresco explícito para pruebas manuales o flujos que requieran forzar rotación.
  csrfPromise = fetchCsrfTokenFromServer().finally(() => {
    csrfPromise = null;
  });
  return csrfPromise;
};

const ensureCsrfToken = async (): Promise<string | null> => {
  const existing = getCookie(CSRF_COOKIE_NAME);
  if (existing) {
    return existing;
  }

  if (!csrfPromise) {
    csrfPromise = refreshCsrfToken();
  }

  return csrfPromise;
};

const readPayload = async <T>(
  response: Response,
  skipJson: boolean,
): Promise<T> => {
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
    throw new ApiError(response.status, "Respuesta JSON inválida", {
      cause: parseError,
      raw,
    });
  }
};

const notifyUnauthorized = (error: ApiError) => {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener(error);
    } catch (listenerError) {
      console.warn("Error en listener de sesión expirada", listenerError);
    }
  });
};

export async function apiCall<T = unknown>(
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<T> {
  const { skipJson = false, headers: baseHeaders, body, ...rest } = options;
  const method = String(rest.method ?? "GET").toUpperCase();
  const headers = buildHeaders(baseHeaders, body);

  if (
    requiresCsrfHeader(method) &&
    !headers.has(CSRF_HEADER_NAME)
  ) {
    const csrfToken =
      getCookie(CSRF_COOKIE_NAME) ?? (await ensureCsrfToken());
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  const config: RequestInit = {
    ...rest,
    body,
    credentials: rest.credentials ?? "include",
    headers,
  };

  const response = await fetch(buildApiUrl(endpoint), config);

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
      errorData &&
      typeof errorData === "object" &&
      "message" in (errorData as Record<string, unknown>)
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
  (payload && typeof payload === "object" && "data" in payload
    ? (payload as ApiEnvelope<T>).data
    : payload) as T;

const clearCsrfCookieForTesting = (): boolean => {
  // NUEVO: Permite caducar manualmente la cookie CSRF durante QA sin afectar el flujo productivo.
  if (typeof document === "undefined") {
    return false;
  }

  document.cookie = `${CSRF_COOKIE_NAME}=; Max-Age=0; Path=/`;
  return true;
};

if (typeof window !== "undefined" && import.meta.env.DEV) {
  // NUEVO: Exponemos utilidades de depuración para verificar la rotación del token desde la consola del navegador.
  const globalWindow = window as typeof window & {
    __csrfTesting__?: {
      clear: () => boolean;
      refresh: () => Promise<string | null>;
      read: () => string | null;
    };
  };

  globalWindow.__csrfTesting__ = {
    clear: clearCsrfCookieForTesting,
    refresh: () => refreshCsrfToken(),
    read: () => getCookie(CSRF_COOKIE_NAME),
  };
}
