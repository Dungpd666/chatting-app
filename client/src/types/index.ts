export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_at: Date;
}

export interface Conversation {
  id: number;
  type: string;
  name: string;
  last_message_at?: Date;
  created_at: Date;
  lastMessage?: Message;
  last_message?: {
    id: number;
    content: string;
    message_type: string;
    created_at: Date;
    sender_id: number;
    sender_username: string;
  };
  unreadCount?: number;
  unread_count?: number;
  otherUser?: User;
  members?: Array<{
    user_id?: number;
    id?: number;
    username?: string;
    email?: string;
    avatar?: string;
    is_admin?: boolean;
  }>;
  participants?: User[];
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  user_id: number;
  content: string;
  message_type: string;
  created_at: Date;
  sender?: User;
  user?: User;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface CreateConversationData {
  type: string;
  name: string;
  user_ids: number[];
}

export interface TypingIndicator {
  userId: number;
  conversationId: number;
  isTyping: boolean;
}
