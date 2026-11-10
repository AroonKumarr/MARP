const API_BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("marp_token") : null;
  const companyId = typeof window !== "undefined" ? localStorage.getItem("marp_company_id") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    let errorData = null;
    try {
      errorData = await response.json();
      if (typeof errorData?.detail === "string") {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        errorDetail = errorData.detail.map((e: any) => e.msg || e.message).join(", ");
      }
    } catch {
      // response wasn't json
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  return response.json();
}
