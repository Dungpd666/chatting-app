import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {User} from "./entities/user.entity";
import {TypeOrmModule} from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        JwtModule,
        MulterModule.register({
            dest: './public/uploads/avatars',
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
