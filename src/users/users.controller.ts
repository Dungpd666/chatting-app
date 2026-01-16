import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put, BadRequestException, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarUploadConfig } from '../config/multer.config';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', avatarUploadConfig))
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.processAvatarUpload(user.sub, file);
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard)
  async deleteAvatar(@CurrentUser() user: any) {
    return this.usersService.deleteUserAvatar(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    const userProfile = await this.usersService.findOne(user.sub);
    if (!userProfile) {
      return null;
    }
    const { password, ...result } = userProfile;
    return result;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateData: {
      username?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const userId = user.sub;
    const userProfile = await this.usersService.findOne(userId);

    if (!userProfile) {
      throw new BadRequestException('User not found');
    }

    if (updateData.currentPassword && updateData.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        updateData.currentPassword,
        userProfile.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(updateData.newPassword, 10);
      userProfile.password = hashedPassword;
    }

    if (updateData.username) {
      userProfile.username = updateData.username;
    }

    if (updateData.email) {
      const existingUser = await this.usersService.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
      userProfile.email = updateData.email;
    }

    // Save updated user
    const updatedUser = await this.usersService.save(userProfile);

    // Return user without password
    const { password, ...result } = updatedUser;
    return result;
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(@Query('q') query: string) {
    return this.usersService.search(query);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
