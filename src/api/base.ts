const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1/api';

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    ...options,
    credentials: 'include', // IMPORTANTE: incluir cookies en todas las peticiones
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      response.status, 
      errorData?.message || `Error: ${response.status}`,
      errorData
    );
  }

  return response.json();
}

// Función helper para manejar respuestas del backend
export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message: string;
}