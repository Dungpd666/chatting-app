import axios from 'axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Conversation,
  Message,
  CreateConversationData,
  User,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3636';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
};

// Conversations API
export const conversationsAPI = {
  getAll: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/conversations');
    return response.data;
  },

  getOne: async (id: number): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/conversations/${id}`);
    return response.data;
  },

  create: async (data: CreateConversationData): Promise<Conversation> => {
    const response = await api.post<Conversation>('/conversations', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  },
};

// Messages API
export const messagesAPI = {
  getByConversation: async (
    conversationId: number,
    limit: number = 50,
    cursor?: number
  ): Promise<Message[]> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(cursor && { cursor: cursor.toString() }),
    });
    const response = await api.get<Message[]>(
      `/messages/conversation/${conversationId}?${params}`
    );
    return response.data;
  },

  create: async (data: {
    conversation_id: number;
    content: string;
    message_type: string;
  }): Promise<Message> => {
    const response = await api.post<Message>('/messages', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/messages/${id}`);
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getOne: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },
};

export default api;
