import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import {Server, Socket} from "socket.io";
import {ChatService} from "./chat.service";
import {JwtService} from "@nestjs/jwt";

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true
    }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect{
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<string, Set<string>>();
    private typingTimeouts = new Map<string, NodeJS.Timeout>();
    private messageRateLimits = new Map<string, number[]>();

    private readonly MESSAGE_RATE_LIMIT = 10;
    private readonly RATE_LIMIT_WINDOW = 10000;
    private readonly TYPING_THROTTLE = 2000;
    private readonly CONNECTION_CLEANUP_INTERVAL = 300000;

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService
    ) {
        setInterval(() => this.cleanupStaleConnections(), this.CONNECTION_CLEANUP_INTERVAL);
    }

    private cleanupStaleConnections() {
        const now = Date.now();
        for (const [userId, socketIds] of this.userSockets.entries()) {
            for (const socketId of socketIds) {
                const socket = this.server.sockets.sockets.get(socketId);
                if (!socket || !socket.connected) {
                    socketIds.delete(socketId);
                }
            }
            if (socketIds.size === 0) {
                this.userSockets.delete(userId);
            }
        }
    }

    private checkRateLimit(userId: string): boolean {
        const now = Date.now();
        const userMessages = this.messageRateLimits.get(userId) || [];

        const recentMessages = userMessages.filter(timestamp => now - timestamp < this.RATE_LIMIT_WINDOW);

        if (recentMessages.length >= this.MESSAGE_RATE_LIMIT) {
            return false;
        }

        recentMessages.push(now);
        this.messageRateLimits.set(userId, recentMessages);
        return true;
    }

        async handleConnection(client: Socket) {
            try {
                const token = client.handshake?.auth?.token ||
                             client.handshake?.headers?.authorization?.split(' ')[1];

                if (!token) {
                    console.log('Connection rejected: No token provided');
                    client.disconnect();
                    return;
                }

                client.data.user = this.jwtService.verify(token);

                const userId = client.data.user?.sub || client.data.user?.id;

                if(!userId) {
                    console.log('Connection rejected: No userId in token');
                    client.disconnect();
                    return;
                }

                if (!this.userSockets.has(userId)) {
                    this.userSockets.set(userId, new Set());
                }
                this.userSockets.get(userId).add(client.id);

                console.log(`User ${userId} connected with socket ${client.id}`);

                client.join(`user_${userId}`);
            } catch (error) {
                console.error('Connection error:', error.message);
                client.disconnect();
            }
        }

    handleDisconnect(client: Socket) {
        const userId = client.data.user?.sub || client.data.user?.id;
        if(userId) {
            const socketIds = this.userSockets.get(userId);
            if (socketIds) {
                socketIds.delete(client.id);
                if (socketIds.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
            console.log(`User ${userId} disconnected`);
        }
    }

    @SubscribeMessage('join_conversation')
    async handleJoinConversation(
        @MessageBody() data: {conversationId: string},
        @ConnectedSocket() client: Socket
    ) {
        try {
            const userId = client.data.user.sub || client.data.user.id;
            const {conversationId} = data;

            const hasAccess = await this.chatService.checkUserInConversation(
                userId,
                conversationId
            )

            if(!hasAccess) {
                client.emit('error', {message: 'Access denied'})
                return;
            }

            const roomName = `conversation_${conversationId}`;
            client.join(roomName);
            console.log(`User ${userId} joined conversation ${conversationId}`);
            client.emit('joined_conversation', {conversationId});
        } catch (error) {
            client.emit('error', {message: error.message});
        }
    }

    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() data: { conversationId: string; content: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = client.data.user.sub || client.data.user.id;
            const { conversationId, content } = data;

            if (!this.checkRateLimit(userId)) {
                client.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
                return;
            }

            if (!content?.trim()) {
                client.emit('error', { message: 'Message content is required' });
                return;
            }

            const message = await this.chatService.createMessage({
                conversationId,
                senderId: userId,
                content: content.trim(),
            });

            const messageData = {
                id: message.id,
                conversation_id: message.conversation_id,
                sender_id: message.user_id,
                content: message.content,
                message_type: message.message_type,
                created_at: message.created_at,
                sender: {
                    id: message.user.id,
                    username: message.user.username,
                    email: message.user.email,
                    avatar: message.user.avatar,
                },
            };

            this.server
                .to(`conversation_${conversationId}`)
                .emit('new_message', messageData);

        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const userId = client.data.user.sub || client.data.user.id;
            const { conversationId } = data;

            await this.chatService.markAsRead(userId, conversationId);

            client.to(`conversation_${conversationId}`).emit('user_read', {
                userId,
                conversationId,
                timestamp: new Date(),
            });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @MessageBody() data: { conversationId: string; isTyping: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.user.sub || client.data.user.id;
        const { conversationId, isTyping } = data;

        const typingKey = `${userId}-${conversationId}`;
        const existingTimeout = this.typingTimeouts.get(typingKey);

        if (existingTimeout && isTyping) {
            return;
        }

        if (isTyping) {
            const timeout = setTimeout(() => {
                this.typingTimeouts.delete(typingKey);
                client.to(`conversation_${conversationId}`).emit('user_typing', {
                    userId,
                    conversationId,
                    isTyping: false,
                });
            }, this.TYPING_THROTTLE);

            this.typingTimeouts.set(typingKey, timeout);
        } else {
            if (existingTimeout) {
                clearTimeout(existingTimeout);
                this.typingTimeouts.delete(typingKey);
            }
        }

        client.to(`conversation_${conversationId}`).emit('user_typing', {
            userId,
            conversationId,
            isTyping,
        });
    }
}

