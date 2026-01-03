import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from '../messages/entities/message.entity';
import { ConversationMember } from '../conversation_members/entities/conversation_member.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, ConversationMember, Conversation]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    providers: [ChatGateway, ChatService],
})
export class ChatModule {}