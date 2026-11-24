// ==============================================================================
// CALYX FRONTEND: CENTRALIZED API CLIENT
// ==============================================================================

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  AuthTokens,
  StandardApiResponse,
  JobPosting,
  JobApplication,
  ParsedResume,
  ResumeSearchResult,
  EvaluationResult,
  AgentTraceResponse,
  DashboardOverview,
  JobDistribution,
} from '../types';

const API_TIMEOUT_MS = 30000; // 30s timeout

export const apiClient: AxiosInstance = axios.create({
  baseURL: '', // Uses Vite proxy in development; Ingress in Kubernetes
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Storage keys
const TOKEN_KEY = 'calyx_access_token';
const REFRESH_KEY = 'calyx_refresh_token';

export const getStoredAccessToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const getStoredRefreshToken = (): string | null => localStorage.getItem(REFRESH_KEY);

export const setStoredTokens = (tokens: AuthTokens) => {
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
};

export const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// ------------------------------------------------------------------------------
// REQUEST INTERCEPTOR: Inject Bearer Token
// ------------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------------------------------------------------------------
// RESPONSE INTERCEPTOR: Token Refresh & Error Normalization
// ------------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();

      // Avoid infinite refresh loops for auth routes
      if (!refreshToken || originalRequest.url?.includes('/api/v1/auth/')) {
        clearStoredTokens();
        return Promise.reject(normalizeApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<StandardApiResponse<AuthTokens>>(
          '/api/v1/auth/refresh',
          { refresh_token: refreshToken },
          { timeout: 10000 }
        );

        const newTokens = refreshResponse.data.data;
        setStoredTokens(newTokens);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newTokens.access_token}`;

        processQueue(null, newTokens.access_token);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearStoredTokens();
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

// Helper to extract human-friendly message from API error envelope
export const normalizeApiError = (error: AxiosError<any>): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.response?.data?.detail) {
    return typeof error.response.data.detail === 'string'
      ? error.response.data.detail
      : JSON.stringify(error.response.data.detail);
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message === 'Network Error') {
    return 'Unable to reach CALYX services. Please check network connectivity or service status.';
  }
  return error.message || 'An unexpected error occurred.';
};

// ==============================================================================
// TYPED ENDPOINT METHODS
// ==============================================================================

export const api = {
  // Auth & Identity
  auth: {
    login: async (credentials: any) => {
      const res = await apiClient.post<StandardApiResponse<AuthTokens>>('/api/v1/auth/login', credentials);
      return res.data.data;
    },
    register: async (payload: any) => {
      const res = await apiClient.post<StandardApiResponse<any>>('/api/v1/auth/register', payload);
      return res.data.data;
    },
    getMe: async () => {
      const res = await apiClient.get<StandardApiResponse<any>>('/api/v1/auth/me');
      return res.data.data;
    },
  },

  // Job Requisitions & Applications
  jobs: {
    list: async (params?: { keyword?: string; department?: string; experience_level?: string; skip?: number; limit?: number }) => {
      const res = await apiClient.get<StandardApiResponse<{ jobs: JobPosting[]; total: number; skip: number; limit: number }>>('/api/v1/jobs', { params });
      return res.data.data;
    },
    getById: async (jobId: string) => {
      const res = await apiClient.get<StandardApiResponse<JobPosting>>(`/api/v1/jobs/${jobId}`);
      return res.data.data;
    },
    create: async (jobData: Partial<JobPosting>) => {
      const res = await apiClient.post<StandardApiResponse<JobPosting>>('/api/v1/jobs', jobData);
      return res.data.data;
    },
    update: async (jobId: string, jobData: Partial<JobPosting>) => {
      const res = await apiClient.put<StandardApiResponse<JobPosting>>(`/api/v1/jobs/${jobId}`, jobData);
      return res.data.data;
    },
    apply: async (jobId: string, applicationData: { job_id: string; resume_id: string; answers: any[] }) => {
      const res = await apiClient.post<StandardApiResponse<JobApplication>>(`/api/v1/jobs/${jobId}/apply`, applicationData);
      return res.data.data;
    },
    getApplicationsForJob: async (jobId: string, status?: string) => {
      const res = await apiClient.get<StandardApiResponse<JobApplication[]>>(`/api/v1/jobs/${jobId}/applications`, { params: { status } });
      return res.data.data;
    },
    getMyApplications: async () => {
      const res = await apiClient.get<StandardApiResponse<JobApplication[]>>('/api/v1/applications/me');
      return res.data.data;
    },
  },

  // Resume Intelligence & Vector Search
  resumes: {
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post<StandardApiResponse<ParsedResume>>('/api/v1/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    uploadText: async (payload: { text_content: string; file_name?: string }) => {
      const res = await apiClient.post<StandardApiResponse<ParsedResume>>('/api/v1/resumes/upload-text', payload);
      return res.data.data;
    },
    getById: async (resumeId: string) => {
      const res = await apiClient.get<StandardApiResponse<ParsedResume>>(`/api/v1/resumes/${resumeId}`);
      return res.data.data;
    },
    getMyResumes: async () => {
      const res = await apiClient.get<StandardApiResponse<ParsedResume[]>>('/api/v1/resumes/candidate/me');
      return res.data.data;
    },
    search: async (searchPayload: { job_description: string; required_skills: string[]; min_experience_years?: number; top_k?: number }) => {
      const res = await apiClient.post<StandardApiResponse<ResumeSearchResult>>('/api/v1/resumes/search', searchPayload);
      return res.data.data;
    },
  },

  // Agentic AI Mesh
  agents: {
    evaluate: async (payload: { application_id: string; candidate_profile: any; job_requirements: any }) => {
      const res = await apiClient.post<StandardApiResponse<EvaluationResult>>('/api/v1/agents/evaluate', payload, {
        timeout: 60000, // 60s timeout for multi-agent reasoning
      });
      return res.data.data;
    },
    getTask: async (taskId: string) => {
      const res = await apiClient.get<StandardApiResponse<any>>(`/api/v1/agents/tasks/${taskId}`);
      return res.data.data;
    },
    getTrace: async (taskId: string) => {
      const res = await apiClient.get<StandardApiResponse<AgentTraceResponse>>(`/api/v1/agents/tasks/${taskId}/trace`);
      return res.data.data;
    },
  },

  // Executive Analytics
  analytics: {
    getDashboard: async () => {
      const res = await apiClient.get<StandardApiResponse<DashboardOverview>>('/api/v1/analytics/dashboard');
      return res.data.data;
    },
    getJobDistribution: async (jobId: string) => {
      const res = await apiClient.get<StandardApiResponse<JobDistribution>>(`/api/v1/analytics/jobs/${jobId}/distribution`);
      return res.data.data;
    },
  },
};
