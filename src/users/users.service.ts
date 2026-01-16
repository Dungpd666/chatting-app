import { Injectable, BadRequestException } from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import {Repository, In} from "typeorm";
import * as fs from 'fs';

export interface AvatarUploadResult {
  message: string;
  avatar: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async processAvatarUpload(userId: number, file: Express.Multer.File): Promise<AvatarUploadResult> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    const user = await this.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.avatar) {
      const oldAvatarPath = `public${user.avatar}`;
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }


    const avatarUrl = `/uploads/avatars/${file.filename}`;
    user.avatar = avatarUrl;
    const updatedUser = await this.save(user);

    const { password, ...result } = updatedUser;
    return {
      message: 'Avatar uploaded successfully',
      avatar: avatarUrl,
      user: result as Omit<User, 'password'>,
    };
  }

  async deleteUserAvatar(userId: number): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.avatar) {
      const avatarPath = `public${user.avatar}`;
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      user.avatar = null;
      await this.save(user);
    }

    const { password, ...result } = user;
    return {
      message: 'Avatar deleted successfully',
      user: result as Omit<User, 'password'>,
    };
  }

  create(createUserDto: CreateUserDto) {
    return this.userRepository.create(createUserDto);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOneBy({id});
  }

  findByEmail(email: string) {
    return this.userRepository.findOneBy({email});
  }

  async findManyByIds(ids: number[]) {
    if (!ids || ids.length === 0) return [];
    return this.userRepository.findBy({ id: In(ids) });
  }

  save(user: User) {
    return this.userRepository.save(user);
  }

  async search(query: string): Promise<User[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    return await this.userRepository
        .createQueryBuilder('user')
        .where('user.username ILIKE :query', {query: `%${query}%`})
        .orWhere('user.email ILIKE :query', {query: `%${query}%`})
        .select(['user.id', 'user.username', 'user.email', 'user.avatar'])
        .limit(20)
        .getMany();
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
