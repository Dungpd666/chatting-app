import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: 'public/uploads/messages',
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = [
        'image/png','image/jpeg','image/jpg','image/gif',
        'application/pdf','application/zip','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Unsupported file type'), false);
      }
      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const url = `/uploads/messages/${file.filename}`;
    return {
      url,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      message_type: file.mimetype.startsWith('image/') ? 'image' : 'file',
    };
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
