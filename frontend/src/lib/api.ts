import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "";

let API_URL = BASE_URL;
if (API_URL.includes('localhost')) {
  // Substituir localhost por 127.0.0.1 para Expo Web
  API_URL = API_URL.replace('localhost', '127.0.0.1');
}
console.log("API BASE URL:", API_URL);

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
};
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Função para renovar token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) throw new Error("Failed to refresh token");

    const data = await response.json();
    const newToken = data.access_token;
    
    await AsyncStorage.setItem("access_token", newToken);
    return newToken;
  } catch (error) {
    console.log("❌ Refresh token failed:", error);
    return null;
  }
};
function buildQueryString(
  params?: Record<string, any>
) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.append(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return query ? `?${query}` : "";
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {},
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 2;
  
  try {
    let token = await AsyncStorage.getItem("access_token");
    
    console.log("🔑 TOKEN DEBUG:");
    console.log("  - Token existe?", !!token);
    
    const headers: Record<string, string> = {
      ...(options.body instanceof FormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const queryString = buildQueryString(options.params);
    const url = `${API_URL}${endpoint}${queryString}`;
    console.log("REQUEST URL:", url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body instanceof FormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    console.log("RESPONSE STATUS:", response.status);
    console.log("RESPONSE DATA:", data);

    // 🔥 TRATAMENTO DE TOKEN EXPIRADO
    if (response.status === 401 && retryCount < MAX_RETRIES) {
      console.log("🔄 Token expired, trying to refresh...");
      
      // Se já está refreshando, aguarda
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return request(endpoint, options, retryCount + 1);
        });
      }

      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          console.log("✅ Token refreshed successfully");
          processQueue(null, newToken);
          // Tenta a requisição novamente com o novo token
          return request(endpoint, options, retryCount + 1);
        } else {
          console.log("❌ Failed to refresh token");
          processQueue(new Error("Failed to refresh token"));
          // Limpa tokens e redireciona para login
          await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
          throw { status: 401, message: "Sessão expirada. Faça login novamente." };
        }
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      throw {
        status: response.status,
        response: { data },
        message: data?.detail || data?.message || "Erro na requisição",
      };
    }

    return data as T;
  } catch (err: any) {
    console.log("API ERROR:", err);

    if (err?.name === "AbortError") {
      throw { message: "Tempo de conexão esgotado" };
    }

    throw err;
  }
}

export const api = {
  get: <T = any>(
    url: string,
    options?: {
      headers?: Record<
        string,
        string
      >;
      params?: Record<
        string,
        any
      >;
    }
  ) =>
    request<T>(url, {
      method: "GET",
      headers:
        options?.headers,
      params:
        options?.params,
    }),

  post: <T = any>(
    url: string,
    body?: any,
    options?: {
      headers?: Record<
        string,
        string
      >;
      params?: Record<
        string,
        any
      >;
    }
  ) =>
    request<T>(url, {
      method: "POST",
      body,
      headers:
        options?.headers,
      params:
        options?.params,
    }),

  put: <T = any>(
    url: string,
    body?: any,
    options?: {
      headers?: Record<
        string,
        string
      >;
      params?: Record<
        string,
        any
      >;
    }
  ) =>
    request<T>(url, {
      method: "PUT",
      body,
      headers:
        options?.headers,
      params:
        options?.params,
    }),

  patch: <T = any>(
    url: string,
    body?: any,
    options?: {
      headers?: Record<
        string,
        string
      >;
      params?: Record<
        string,
        any
      >;
    }
  ) =>
    request<T>(url, {
      method: "PATCH",
      body,
      headers:
        options?.headers,
      params:
        options?.params,
    }),

  delete: <T = any>(
    url: string,
    options?: {
      headers?: Record<
        string,
        string
      >;
      params?: Record<
        string,
        any
      >;
    }
  ) =>
    request<T>(url, {
      method: "DELETE",
      headers:
        options?.headers,
      params:
        options?.params,
    }),
};

export function formatApiError(
  err: any
): string {
  const detail =
    err?.response?.data
      ?.detail;

  if (!detail) {
    return (
      err?.message ||
      "Erro inesperado"
    );
  }

  if (
    typeof detail ===
    "string"
  ) {
    return detail;
  }

  if (
    Array.isArray(detail)
  ) {
    return detail
      .map((e: any) =>
        typeof e?.msg ===
        "string"
          ? e.msg
          : JSON.stringify(e)
      )
      .join(" ");
  }

  return String(detail);
}

console.log(
  "API BASE URL:",
  API_URL
);