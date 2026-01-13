import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Message} from "../messages/entities/message.entity";
import {ConversationMember} from "../conversation_members/entities/conversation_member.entity";
import {Conversation} from "../conversations/entities/conversation.entity";

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(ConversationMember)
        private memberRepository: Repository<ConversationMember>,
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
    ) {}

    async checkUserInConversation(
        userId: string,
        conversationId: string
    ): Promise<boolean> {
        const member = await this.memberRepository.findOne({
            where: {
                user_id: parseInt(userId),
                conversation_id: parseInt(conversationId),
            },
        });

        return !!member;
    }

    async createMessage(data: {
        conversationId: string;
        senderId: string;
        content?: string;
        attachment_url?: string;
        attachment_name?: string;
        attachment_type?: string;
        attachment_size?: number;
    }) {
        const messageType = data.attachment_url
            ? (data.attachment_type?.startsWith('image/') ? 'image' : 'file')
            : 'text';

        const message = this.messageRepository.create({
            conversation_id: parseInt(data.conversationId),
            user_id: parseInt(data.senderId),
            content: data.content || null,
            message_type: messageType,
            attachment_url: data.attachment_url || null,
            attachment_name: data.attachment_name || null,
            attachment_type: data.attachment_type || null,
            attachment_size: data.attachment_size ?? null,
            created_at: new Date(),
        });

        const savedMessage = await this.messageRepository.save(message);

        await this.conversationRepository.update(
            parseInt(data.conversationId),
            {
                last_message_at: savedMessage.created_at,
            }
        );

        return await this.messageRepository.findOne({
            where: { id: savedMessage.id },
            relations: ['user'],
        });
    }

    async markAsRead(userId: string, conversationId: string) {
         await this.memberRepository.update(
            {
                user_id: parseInt(userId),
                conversation_id: parseInt(conversationId),
            },
            {
                last_seen_at: new Date(),
            },
        );
    }

    async getConversationMembers(conversationId: string): Promise<number[]> {
        const members = await this.memberRepository.find({
            where: { conversation_id: parseInt(conversationId) },
        });
        return members.map(member => member.user_id);
    }
}