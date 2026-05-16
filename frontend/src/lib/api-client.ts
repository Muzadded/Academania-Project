import { ApiErrorResponse, ApiResponse } from '@academania/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    const error = json as ApiErrorResponse;
    throw new Error(error.message ?? 'Request failed');
  }

  return (json as ApiResponse<T>).data;
}
