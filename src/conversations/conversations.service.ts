import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation } from "./entities/conversation.entity";
import { ConversationMember } from "../conversation_members/entities/conversation_member.entity";
import { UsersService } from '../users/users.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private conversationMemberRepository: Repository<ConversationMember>,
    private usersService: UsersService,
  ) {}

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

    if (type === 'private') {
      type = 'direct';
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
      const currentUser = await this.usersService.findOne(userId);
      if (!participant) {
        throw new NotFoundException('Participant not found');
      }

      const conversation = this.conversationRepository.create({
        type: 'direct',
        name: `${currentUser.username} & ${participant.username}`,
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

    const result = await Promise.all(
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
            unreadCount = await this.conversationRepository.query(
              `SELECT COUNT(*) as count FROM messages
               WHERE conversation_id = $1 AND created_at > $2`,
              [conv.id, lastSeenAt]
            ).then(result => parseInt(result[0].count));
          }
        }

        const lastMessage = await this.conversationRepository.query(
          `SELECT m.id, m.content, m.message_type, m.created_at, m.user_id as sender_id,
                  u.username as sender_username
           FROM messages m
           LEFT JOIN users u ON u.id = m.user_id
           WHERE m.conversation_id = $1
           ORDER BY m.created_at DESC
           LIMIT 1`,
          [conv.id]
        ).then(result => result[0] || null);

        return {
          ...conv,
          members: members.map(m => ({
            user_id: m.user_id,
            username: m.user?.username,
            email: m.user?.email,
            avatar: m.user?.avatar,
            is_admin: m.is_admin,
          })),
          unread_count: unreadCount,
          last_message: lastMessage,
        };
      })
    );

    return result;
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

    return {
      ...conversation,
      members: members.map(m => ({
        user_id: m.user_id,
        username: m.user?.username,
        email: m.user?.email,
        avatar: m.user?.avatar,
        joined_at: m.joined_at,
        is_admin: m.is_admin,
      })),
    };
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return this.conversationRepository.update(id, updateConversationDto);
  }

  remove(id: number) {
    return this.conversationRepository.delete(id);
  }
}
