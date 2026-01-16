import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { messageUploadConfig } from '../config/multer.config';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', messageUploadConfig))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.messagesService.processUploadedFile(file);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(user.sub, createMessageDto);
  }

  @Get('conversation/:conversationId/search')
  searchMessages(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.searchMessages(
      user.sub,
      +conversationId,
      query,
      limit ? +limit : 50,
    );
  }

  @Get('conversation/:conversationId')
  findByConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.findByConversation(
      user.sub,
      +conversationId,
      limit ? +limit : 50,
      cursor ? +cursor : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}
