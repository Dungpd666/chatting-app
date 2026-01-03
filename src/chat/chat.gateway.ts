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

    private userSockets = new Map<string, string>();
    constructor(
        private chatService: ChatService,
        private jwtService: JwtService
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake?.auth?.token ||
                         client.handshake?.headers?.authorization?.split(' ')[1];

            if (!token) {
                console.log('Connection rejected: No token provided');
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.data.user = payload;

            const userId = client.data.user?.sub || client.data.user?.id;

            if(!userId) {
                console.log('Connection rejected: No userId in token');
                client.disconnect();
                return;
            }

            this.userSockets.set(userId, client.id);

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
            this.userSockets.delete(userId);
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

            client.join(`conversation_${conversationId}`);
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

            if (!content?.trim()) {
                client.emit('error', { message: 'Message content is required' });
                return;
            }

            const message = await this.chatService.createMessage({
                conversationId,
                senderId: userId,
                content: content.trim(),
            });

            this.server
                .to(`conversation_${conversationId}`)
                .emit('new_message', {
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
                });

            console.log(`Message sent to conversation ${conversationId}`);

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

        client.to(`conversation_${conversationId}`).emit('user_typing', {
            userId,
            conversationId,
            isTyping,
        });
    }
}

