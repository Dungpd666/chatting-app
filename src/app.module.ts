import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
import {ChatModule} from "./chat/chat.module";


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            entities: [User, Conversation, ConversationMember, Message],
            synchronize: process.env.NODE_ENV !== 'production',
            migrations: ['dist/database/migrations/*.js'],
            migrationsRun: process.env.NODE_ENV === 'production',
            extra: {
                max: 20,
                min: 5,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            },
            cache: {
                type: 'database',
                duration: 60000,
            },
            logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        }),
        UsersModule,
        ConversationsModule,
        ConversationMembersModule,
        MessagesModule,
        AuthModule,
        ChatModule,
    ],  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
