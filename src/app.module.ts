import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ConversationMembersModule } from './conversation_members/conversation_members.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { User } from "./users/entities/user.entity";
import { Conversation } from "./conversations/entities/conversation.entity";
import { ConversationMember } from "./conversation_members/entities/conversation_member.entity";
import { Message } from "./messages/entities/message.entity";


@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            entities: [User, Conversation, ConversationMember, Message],
            synchronize: false
        }),
        UsersModule,
        ConversationsModule,
        ConversationMembersModule,
        MessagesModule,
        AuthModule,
    ],  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
