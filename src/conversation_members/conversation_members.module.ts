import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationMembersService } from './conversation_members.service';
import { ConversationMembersController } from './conversation_members.controller';
import { ConversationMember } from './entities/conversation_member.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationMember, Conversation]),
  ],
  controllers: [ConversationMembersController],
  providers: [ConversationMembersService],
  exports: [ConversationMembersService],
})
export class ConversationMembersModule {}
