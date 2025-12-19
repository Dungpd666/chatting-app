import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConversationMembersService } from './conversation_members.service';
import { CreateConversationMemberDto } from './dto/create-conversation_member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation_member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationMembersController {
  constructor(private readonly conversationMembersService: ConversationMembersService) {}

  @Post(':id/read')
  markAsRead(@CurrentUser() user: any, @Param('id') conversationId: string) {
    return this.conversationMembersService.markAsRead(user.sub, +conversationId);
  }
}
