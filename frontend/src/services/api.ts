import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: API_URL ? `${API_URL}/api` : '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    googleLogin: async (token: string) => {
        const response = await api.post('/auth/google', { token });
        const { access_token, user } = response.data;
        localStorage.setItem('auth_token', access_token);
        return user;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
    },
};

// Files API
export const filesApi = {
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    process: async (fileId: string, pages: number[], quality = '4K', customPrompt?: string) => {
        const response = await api.post('/files/process', {
            file_id: fileId,
            pages,
            quality,
            custom_prompt: customPrompt,
        });
        return response.data;
    },

    getStatus: async (fileId: string) => {
        const response = await api.get(`/files/${fileId}/status`);
        return response.data;
    },

    download: async (fileId: string, page: number) => {
        const response = await api.get(`/files/${fileId}/download`, {
            params: { page },
        });
        return response.data;
    },
};

export default api;
