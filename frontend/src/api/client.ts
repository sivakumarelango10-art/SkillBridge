const API_BASE = '/api';

export interface ApiError {
  error: string;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // essential for httpOnly session cookies
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    if (isJson) {
      const errorJson = await res.json();
      errorMsg = errorJson.error || errorMsg;
    } else {
      const text = await res.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  if (isJson) {
    return (await res.json()) as T;
  }
  return {} as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiFetch<{ message: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { name: string; email: string; password: string; role?: string }) =>
      apiFetch<{ message: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
    me: () =>
      apiFetch<{ user: any }>('/auth/me'),
    deleteAccount: () =>
      apiFetch<{ message: string }>('/auth/account', { method: 'DELETE' }),
  },

  challenges: {
    getActive: () =>
      apiFetch<{ challenge: any }>('/challenges/active'),
    downloadDatasetUrl: (challengeId: string) =>
      `/api/challenges/${challengeId}/dataset`,
  },

  submissions: {
    getDraft: () =>
      apiFetch<{ draft: any }>('/submissions/draft'),
    saveDraft: (data: { challengeId?: string; answers?: any; findings?: any; explanation?: string }) =>
      apiFetch<{ message: string; draftId: string; updatedAt: string }>('/submissions/draft', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submit: (formData: FormData) =>
      apiFetch<{ message: string; submission: any }>('/submissions', {
        method: 'POST',
        body: formData,
      }),
    list: () =>
      apiFetch<{ submissions: any[] }>('/submissions'),
    getById: (id: string) =>
      apiFetch<{ submission: any }>(`/submissions/${id}`),
  },

  portfolio: {
    get: () =>
      apiFetch<{ items: any[]; shareLink: { token: string; createdAt: string } | null }>('/portfolio'),
    toggle: (submissionId: string, visible: boolean) =>
      apiFetch<{ message: string }>('/portfolio/toggle', {
        method: 'POST',
        body: JSON.stringify({ submissionId, visible }),
      }),
    share: () =>
      apiFetch<{ message: string; token: string; shareUrl: string }>('/portfolio/share', {
        method: 'POST',
      }),
    revoke: () =>
      apiFetch<{ message: string }>('/portfolio/share', {
        method: 'DELETE',
      }),
    getPublic: (token: string) =>
      apiFetch<{ learner: { name: string; joinedAt: string }; projects: any[] }>(`/portfolio/public/${token}`),
  },

  mentor: {
    getAssessments: () =>
      apiFetch<{ assessments: any[] }>('/mentor/assessments'),
    submitReview: (data: { assessmentId: string; levels: Record<string, string>; notes?: string }) =>
      apiFetch<{ message: string; review: any }>('/mentor/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAgreement: () =>
      apiFetch<{
        totalReviews: number;
        totalComparisons: number;
        totalAgreed: number;
        overallAgreementRate: number;
        criteriaBreakdown: Record<string, { total: number; agreed: number; rate: number }>;
      }>('/mentor/agreement'),
  },

  admin: {
    reSeed: () =>
      apiFetch<{ message: string }>('/admin/seed', { method: 'POST' }),
    getStatus: () =>
      apiFetch<{ metrics: any; challenge: any }>('/admin/status'),
  },
};
