  import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3636';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectCallback: (() => void) | null = null;
  private messageCallbacks: Set<(message: any) => void> = new Set();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token;

      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        if (this.reconnectCallback) {
          this.reconnectCallback();
        }

        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
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

  sendMessage(conversationId: number, content: string): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversationId: conversationId.toString(),
        content,
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

  onNewMessage(
    callback: (message: Message & { sender: { id: number; username: string; email: string; avatar?: string } }) => void
  ): void {
    this.messageCallbacks.add(callback);

    if (this.socket && this.messageCallbacks.size === 1) {
      this.socket.off('new_message');
      this.socket.on('new_message', (message) => {
        this.messageCallbacks.forEach(cb => cb(message));
      });
    }
  }

  onUserTyping(callback: (data: { userId: number; conversationId: number; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.off('user_typing');
      this.socket.on('user_typing', callback);
    }
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
    if (callback) {
      this.messageCallbacks.delete(callback);
    } else {
      this.messageCallbacks.clear();
    }

    if (this.messageCallbacks.size === 0 && this.socket) {
      this.socket.off('new_message');
    }
  }

  offUserTyping(): void {
    if (this.socket) {
      this.socket.off('user_typing');
    }
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
