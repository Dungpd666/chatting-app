import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddMembersDto } from './dto/add-members.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(user.sub, createConversationDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.conversationsService.findAllByUser(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.findOne(user.sub, +id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(+id, updateConversationDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.conversationsService.remove(+id);
  }

  @Post(':id/members')
  addMembers(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.conversationsService.addMembers(user.sub, +id, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(@CurrentUser() user: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.conversationsService.removeMember(user.sub, +id, { user_id: +userId });
  }
}
