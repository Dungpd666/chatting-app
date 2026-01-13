import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectCallback: (() => void) | null = null;
  private messageCallbacks = new Set<(message: any) => void>();
  private typingCallbacks = new Set<(data: { userId: number; conversationId: number; isTyping: boolean }) => void>();
  private messageListenerBound = false;
  private typingListenerBound = false;

  private bindMessageListener() {
    if (!this.socket || this.messageListenerBound) return;
    this.socket.off('new_message');
    this.socket.on('new_message', (message) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });
    this.messageListenerBound = true;
  }

  private bindTypingListener() {
    if (!this.socket || this.typingListenerBound) return;
    this.socket.off('user_typing');
    this.socket.on('user_typing', (data) => {
      this.typingCallbacks.forEach(cb => cb(data));
    });
    this.typingListenerBound = true;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;
      this.socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });

      this.bindMessageListener();
      this.bindTypingListener();

      this.socket.on('connect', () => {
        this.bindMessageListener();
        this.bindTypingListener();
        this.reconnectCallback?.();
        resolve();
      });

      this.socket.on('disconnect', () => { this.messageListenerBound = false; this.typingListenerBound = false; });
      this.socket.on('connect_error', reject);
    });
  }

  onReconnect(callback: () => void): void {
    this.reconnectCallback = callback;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('join_conversation', { conversationId: conversationId.toString() });
    }
  }

  sendMessage(conversationId: number, content?: string, attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversationId: conversationId.toString(),
        content,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
        attachment_size: attachment?.size,
      });
    }
  }

  markAsRead(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('mark_read', {
        conversationId: conversationId.toString(),
      });
    }
  }

  sendTyping(conversationId: number, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', {
        conversationId: conversationId.toString(),
        isTyping,
      });
    }
  }

  onNewMessage(callback: (message: Message) => void): void {
    this.messageCallbacks.add(callback);
    this.bindMessageListener();
  }

  onUserTyping(callback: (data: { userId: number; conversationId: number; isTyping: boolean }) => void): void {
    this.typingCallbacks.add(callback);
    this.bindTypingListener();
  }

  onUserRead(callback: (data: { userId: number; conversationId: number; timestamp: Date }) => void): void {
    if (this.socket) {
      this.socket.on('user_read', callback);
    }
  }

  onJoinedConversation(callback: (data: { conversationId: string }) => void): void {
    if (this.socket) {
      this.socket.on('joined_conversation', callback);
    }
  }

  offNewMessage(callback?: (message: any) => void): void {
    if (callback) this.messageCallbacks.delete(callback);
    else this.messageCallbacks.clear();

    if (this.messageCallbacks.size === 0 && this.socket) {
      this.socket.off('new_message');
      this.messageListenerBound = false;
    }
  }

  offUserTyping(): void {
    this.typingCallbacks.clear();
    if (this.socket) {
      this.socket.off('user_typing');
    }
    this.typingListenerBound = false;
  }

  offUserRead(): void {
    if (this.socket) {
      this.socket.off('user_read');
    }
  }

  offJoinedConversation(): void {
    if (this.socket) {
      this.socket.off('joined_conversation');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;
