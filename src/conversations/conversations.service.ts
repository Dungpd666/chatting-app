import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation } from "./entities/conversation.entity";
import { ConversationMember } from "../conversation_members/entities/conversation_member.entity";
import { UsersService } from '../users/users.service';
import { Message } from '../messages/entities/message.entity';
import { AddMembersDto } from './dto/add-members.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private conversationMemberRepository: Repository<ConversationMember>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private usersService: UsersService,
  ) {}

  /**
   * Get display name for a conversation based on current user
   * - Direct chat: Returns the other participant's username
   * - Group chat: Returns the conversation name from DB
   */
  private getDisplayName(
    conversation: Conversation,
    members: Array<{ user_id: number; username?: string; avatar?: string }>,
    currentUserId: number,
  ): string {
    if (conversation.type === 'direct') {
      const otherMember = members.find(m => m.user_id !== currentUserId);
      return otherMember?.username || 'Unknown User';
    }
    return conversation.name || 'Unnamed Group';
  }

  /**
   * Get avatar for a conversation based on current user
   * - Direct chat: Returns the other participant's avatar
   * - Group chat: Returns null (no single avatar)
   */
  private getDisplayAvatar(
    conversation: Conversation,
    members: Array<{ user_id: number; avatar?: string }>,
    currentUserId: number,
  ): string | null {
    if (conversation.type === 'direct') {
      const otherMember = members.find(m => m.user_id !== currentUserId);
      return otherMember?.avatar || null;
    }
    return null;
  }

  async create(userId: number, createConversationDto: CreateConversationDto) {
    let { type, name, participant_id, participant_ids, user_ids } = createConversationDto;

    if (user_ids && user_ids.length > 0) {
      if (user_ids.length === 1) {
        type = 'direct';
        participant_id = user_ids[0];
      } else {
        type = 'group';
        participant_ids = user_ids;
      }
    }

    if (type === 'direct' && !participant_id) {
      throw new BadRequestException('participant_id is required for direct chat');
    }
    if (type === 'group' && (!participant_ids || participant_ids.length === 0)) {
      throw new BadRequestException('participant_ids are required for group chat');
    }

    if (type === 'direct') {
      const existingConversation = await this.conversationRepository
        .createQueryBuilder('conv')
        .innerJoin('conversation_members', 'cm1', 'cm1.conversation_id = conv.id AND cm1.user_id = :userId', { userId })
        .innerJoin('conversation_members', 'cm2', 'cm2.conversation_id = conv.id AND cm2.user_id = :participantId', { participantId: participant_id })
        .where('conv.type = :type', { type: 'direct' })
        .getOne();

      if (existingConversation) {
        return this.findOne(userId, existingConversation.id);
      }

      const participant = await this.usersService.findOne(participant_id);
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const conversation = this.conversationRepository.create({
        type: 'direct',
        name: null,
        created_at: new Date(),
      });

      const savedConversation = await this.conversationRepository.save(conversation);

      const members = [
        this.conversationMemberRepository.create({
          conversation_id: savedConversation.id,
          user_id: userId,
          joined_at: new Date(),
          is_admin: false,
        }),
        this.conversationMemberRepository.create({
          conversation_id: savedConversation.id,
          user_id: participant_id,
          joined_at: new Date(),
          is_admin: false,
        }),
      ];

      await this.conversationMemberRepository.save(members);

      return this.findOne(userId, savedConversation.id);
    }

    if (type === 'group') {
      if (!name) {
        throw new BadRequestException('name is required for group chat');
      }

      const conversation = this.conversationRepository.create({
        type: 'group',
        name,
        created_at: new Date(),
      });
      const savedConversation = await this.conversationRepository.save(conversation);

      const allParticipants = [userId, ...participant_ids];
      const members = allParticipants.map((id) =>
        this.conversationMemberRepository.create({
          conversation_id: savedConversation.id,
          user_id: id,
          joined_at: new Date(),
          is_admin: id === userId,
        })
      );

      await this.conversationMemberRepository.save(members);

      return this.findOne(userId, savedConversation.id);
    }
  }

  async findAllByUser(userId: number) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conv')
      .innerJoin('conversation_members', 'cm', 'cm.conversation_id = conv.id')
      .where('cm.user_id = :userId', { userId })
      .orderBy('conv.last_message_at', 'DESC', 'NULLS LAST')
      .addOrderBy('conv.created_at', 'DESC')
      .getMany();

    return Promise.all(
      conversations.map(async (conv) => {
        const members = await this.conversationMemberRepository
          .createQueryBuilder('cm')
          .leftJoinAndSelect('cm.user', 'user')
          .where('cm.conversation_id = :convId', { convId: conv.id })
          .getMany();

        const member = await this.conversationMemberRepository.findOne({
          where: { conversation_id: conv.id, user_id: userId },
        });

        let unreadCount = 0;
        if (member && conv.last_message_at) {
          const lastSeenAt = member.last_seen_at || member.joined_at;
          if (conv.last_message_at > lastSeenAt) {
            unreadCount = await this.messageRepository
              .createQueryBuilder('m')
              .where('m.conversation_id = :convId', { convId: conv.id })
              .andWhere('m.created_at > :lastSeenAt', { lastSeenAt })
              .getCount();
          }
        }

        const lastMessageEntity = await this.messageRepository
          .createQueryBuilder('m')
          .leftJoinAndSelect('m.user', 'user')
          .where('m.conversation_id = :convId', { convId: conv.id })
          .orderBy('m.created_at', 'DESC')
          .getOne();

        const lastMessage = lastMessageEntity
          ? {
              id: lastMessageEntity.id,
              content: lastMessageEntity.content,
              message_type: lastMessageEntity.message_type,
              created_at: lastMessageEntity.created_at,
              sender_id: lastMessageEntity.user_id,
              sender_username: lastMessageEntity.user?.username,
            }
          : null;

        const membersList = members.map(m => ({
          user_id: m.user_id,
          username: m.user?.username,
          email: m.user?.email,
          avatar: m.user?.avatar,
          is_admin: m.is_admin,
        }));

        return {
          ...conv,
          display_name: this.getDisplayName(conv, membersList, userId),
          display_avatar: this.getDisplayAvatar(conv, membersList, userId),
          members: membersList,
          unread_count: unreadCount,
          last_message: lastMessage,
        };
      })
    );
  }

  async findOne(userId: number, id: number) {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isMember = await this.conversationMemberRepository.findOne({
      where: { conversation_id: id, user_id: userId },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const members = await this.conversationMemberRepository
      .createQueryBuilder('cm')
      .leftJoinAndSelect('cm.user', 'user')
      .where('cm.conversation_id = :convId', { convId: id })
      .getMany();

    const membersList = members.map(m => ({
      user_id: m.user_id,
      username: m.user?.username,
      email: m.user?.email,
      avatar: m.user?.avatar,
      joined_at: m.joined_at,
      is_admin: m.is_admin,
    }));

    return {
      ...conversation,
      display_name: this.getDisplayName(conversation, membersList, userId),
      display_avatar: this.getDisplayAvatar(conversation, membersList, userId),
      members: membersList,
    };
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return this.conversationRepository.update(id, updateConversationDto);
  }

  remove(id: number) {
    return this.conversationRepository.delete(id);
  }

  async addMembers(adminUserId: number, conversationId: number, dto: AddMembersDto) {
    const uniqueIds = [...new Set(dto.user_ids)].filter(id => id !== adminUserId);
    if (uniqueIds.length === 0) throw new BadRequestException('No valid members to add');

    const existingMembers = await this.conversationMemberRepository.find({
      where: uniqueIds.map(id => ({ conversation_id: conversationId, user_id: id })),
    });
    const existingIds = new Set(existingMembers.map(m => m.user_id));
    const toCreate = uniqueIds.filter(id => !existingIds.has(id));

    if (toCreate.length === 0) {
      return { added: 0, skipped: existingIds.size };
    }

    const newMembers = toCreate.map(id =>
      this.conversationMemberRepository.create({
        conversation_id: conversationId,
        user_id: id,
        joined_at: new Date(),
        is_admin: false,
      })
    );
    await this.conversationMemberRepository.save(newMembers);

    return { added: newMembers.length, skipped: existingIds.size };
  }

  async removeMember(adminUserId: number, conversationId: number, dto: RemoveMemberDto) {
    const { user_id } = dto;

    const targetMember = await this.conversationMemberRepository.findOne({ where: { conversation_id: conversationId, user_id } });
    if (!targetMember) throw new NotFoundException('Target member not found in this conversation');

    if (targetMember.is_admin) {
      const adminCount = await this.conversationMemberRepository.count({ where: { conversation_id: conversationId, is_admin: true } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin');
      }
    }

    await this.conversationMemberRepository.delete({ conversation_id: conversationId, user_id });
    return { removed: true };
  }
}