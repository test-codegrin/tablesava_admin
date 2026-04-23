import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { AUTH_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from "../constants/auth";

type NormalizableResponseShape<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  vendor?: T;
  token?: string;
} & Record<string, unknown>;

export type NormalizedResponse<T> = {
  success: boolean;
  message?: string;
  data: T | null;
  raw: unknown;
};

export type ParsedApiError = {
  status: number | null;
  message: string;
  details?: unknown;
};

const RETRYABLE_GET_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_GET_RETRIES = 2;
const RETRY_DELAY_MS = 200;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFormDataBody = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const getMessageFromPayload = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (isRecord(payload.data) && typeof payload.data.message === "string") {
    return payload.data.message;
  }

  return undefined;
};

const getStatusFallbackMessage = (status: number | null) => {
  switch (status) {
    case 400:
      return "Bad request. Please review the submitted data.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission for this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "Conflict detected. Please refresh and try again.";
    case 500:
      return "Server error. Please try again in a moment.";
    default:
      return "Request failed. Please try again.";
  }
};

export class ApiRequestError extends Error {
  status: number | null;
  details?: unknown;

  constructor(parsed: ParsedApiError) {
    super(parsed.message);
    this.name = "ApiRequestError";
    this.status = parsed.status;
    this.details = parsed.details;
  }
}

export const parseApiError = (error: unknown): ParsedApiError => {
  if (error instanceof ApiRequestError) {
    return {
      status: error.status,
      message: error.message,
      details: error.details,
    };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const payload = error.response?.data;
    return {
      status,
      message:
        getMessageFromPayload(payload) ?? getStatusFallbackMessage(status),
      details: isRecord(payload) ? payload.data : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      status: null,
      message: error.message || getStatusFallbackMessage(null),
    };
  }

  return {
    status: null,
    message: getStatusFallbackMessage(null),
  };
};

export const normalizeResponse = <T>(
  payload: unknown,
  status: number,
): NormalizedResponse<T> => {
  if (!isRecord(payload)) {
    return {
      success: status >= 200 && status < 300,
      message: undefined,
      data: (payload ?? null) as T | null,
      raw: payload,
    };
  }

  const typedPayload = payload as NormalizableResponseShape<T>;
  const success =
    typeof typedPayload.success === "boolean"
      ? typedPayload.success
      : status >= 200 && status < 300;

  const message = getMessageFromPayload(payload);

  if (typeof typedPayload.data !== "undefined") {
    return { success, message, data: typedPayload.data ?? null, raw: payload };
  }

  if (typeof typedPayload.vendor !== "undefined") {
    return { success, message, data: typedPayload.vendor ?? null, raw: payload };
  }

  if (
    typeof typedPayload.token === "string" ||
    Object.keys(typedPayload).some((key) => key !== "success" && key !== "message")
  ) {
    return { success, message, data: typedPayload as T, raw: payload };
  }

  return {
    success,
    message,
    data: null,
    raw: payload,
  };
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const shouldRetryRequest = (
  config: AxiosRequestConfig,
  error: unknown,
  attempt: number,
  maxRetries: number,
) => {
  const method = (config.method || "get").toLowerCase();
  if (method !== "get" || attempt >= maxRetries) {
    return false;
  }

  if (!axios.isAxiosError(error)) {
    return true;
  }

  if (!error.response) {
    return true;
  }

  return RETRYABLE_GET_STATUSES.has(error.response.status);
};

export const buildVendorAuthHeaders = (token: string | null | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : {};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);

    if (token) {
      config.headers.Authorization = buildVendorAuthHeaders(token).Authorization;
    }

    if (!config.headers.Accept) {
      config.headers.Accept = "application/json";
    }

    if (!config.headers["Content-Type"] && !isFormDataBody(config.data)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
    }

    return Promise.reject(error);
  },
);

export async function requestApi<T>(
  config: AxiosRequestConfig,
  options?: { getRetries?: number },
): Promise<NormalizedResponse<T>> {
  const maxRetries = options?.getRetries ?? DEFAULT_GET_RETRIES;
  let attempt = 0;

  while (true) {
    try {
      const response: AxiosResponse<unknown> = await api.request(config);
      const normalized = normalizeResponse<T>(response.data, response.status);

      if (!normalized.success) {
        throw new ApiRequestError({
          status: response.status,
          message: normalized.message || getStatusFallbackMessage(response.status),
          details: normalized.raw,
        });
      }

      return normalized;
    } catch (error) {
      if (shouldRetryRequest(config, error, attempt, maxRetries)) {
        attempt += 1;
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      throw new ApiRequestError(parseApiError(error));
    }
  }
}

export default api;
