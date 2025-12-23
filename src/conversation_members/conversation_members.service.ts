import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConversationMemberDto } from './dto/create-conversation_member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation_member.dto';
import { ConversationMember } from './entities/conversation_member.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class ConversationMembersService {
  constructor(
    @InjectRepository(ConversationMember)
    private conversationMemberRepository: Repository<ConversationMember>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async markAsRead(userId: number, conversationId: number) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const member = await this.conversationMemberRepository.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const now = new Date();
    await this.conversationMemberRepository.update(
      { conversation_id: conversationId, user_id: userId },
      { last_seen_at: now }
    );

    return {
      success: true,
      last_seen_at: now,
    };
  }
}
