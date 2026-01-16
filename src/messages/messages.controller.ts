import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { messageUploadConfig, UPLOAD_PATHS } from '../config/multer.config';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Query('name') originalName: string,
    @Res() res: Response,
  ) {
    const filePath = join(process.cwd(), UPLOAD_PATHS.messages, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const downloadName = originalName || filename;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.sendFile(filePath);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', messageUploadConfig))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.messagesService.processUploadedFile(file);
  }

  @Get('conversation/:conversationId/search')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(user.sub, createMessageDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(+id, updateMessageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.messagesService.remove(+id);
  }
}
