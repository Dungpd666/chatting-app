import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from "./entities/message.entity";
import { Conversation } from "../conversations/entities/conversation.entity";
import { ConversationMember } from "../conversation_members/entities/conversation_member.entity";

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private conversationMemberRepository: Repository<ConversationMember>,
  ) {}

  async create(userId: number, createMessageDto: CreateMessageDto) {
    const { conversation_id, content, message_type } = createMessageDto;

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversation_id },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isMember = await this.conversationMemberRepository.findOne({
      where: { conversation_id, user_id: userId },
    });
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const message = this.messageRepository.create({
      conversation_id,
      user_id: userId,
      content,
      message_type,
      created_at: new Date(),
    });

    const savedMessage = await this.messageRepository.save(message);

    await this.conversationRepository.update(conversation_id, {
      last_message_at: savedMessage.created_at,
    });

    return this.findOne(savedMessage.id);
  }

  async findByConversation(
    userId: number,
    conversationId: number,
    limit: number = 50,
    cursor?: number,
  ) {
    const isMember = await this.conversationMemberRepository.findOne({
      where: { conversation_id: conversationId, user_id: userId },
      cache: true,
    });
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const queryBuilder = this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.user', 'user')
      .where('msg.conversation_id = :conversationId', { conversationId })
      .orderBy('msg.created_at', 'ASC')
      .addOrderBy('msg.id', 'ASC')
      .limit(limit + 1);

    if (cursor) {
      queryBuilder.andWhere('msg.id > :cursor', { cursor });
    }

    const messages = await queryBuilder.getMany();

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }
    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    return {
      messages: messages.map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        content: msg.content,
        message_type: msg.message_type,
        created_at: msg.created_at,
        user: {
          id: msg.user.id,
          username: msg.user.username,
          avatar: msg.user.avatar,
        },
      })),
      has_more: hasMore,
      next_cursor: nextCursor,
    };
  }

  async findOne(id: number) {
    const message = await this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.user', 'user')
      .where('msg.id = :id', { id })
      .getOne();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      content: message.content,
      message_type: message.message_type,
      created_at: message.created_at,
      user: {
        id: message.user.id,
        username: message.user.username,
        avatar: message.user.avatar,
      },
    };
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return this.messageRepository.update(id, updateMessageDto);
  }

  remove(id: number) {
    return this.messageRepository.delete(id);
  }

  async searchMessages(
    userId: number,
    conversationId: number,
    searchQuery: string,
    limit: number = 50,
  ) {
    const isMember = await this.conversationMemberRepository.findOne({
      where: { conversation_id: conversationId, user_id: userId },
      cache: true,
    });
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    if (!searchQuery || searchQuery.trim() === '') {
      return [];
    }

    const messages = await this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.user', 'user')
      .where('msg.conversation_id = :conversationId', { conversationId })
      .andWhere(
        "to_tsvector('english', msg.content) @@ plainto_tsquery('english', :query)",
        { query: searchQuery }
      )
      .orderBy(
        "ts_rank(to_tsvector('english', msg.content), plainto_tsquery('english', :query))",
        'DESC'
      )
      .setParameter('query', searchQuery)
      .addOrderBy('msg.created_at', 'DESC')
      .limit(limit)
      .getMany();

    return messages.map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      content: msg.content,
      message_type: msg.message_type,
      created_at: msg.created_at,
      user: {
        id: msg.user.id,
        username: msg.user.username,
        avatar: msg.user.avatar,
      },
    }));
  }
}
