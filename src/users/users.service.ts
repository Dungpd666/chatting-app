import {Injectable} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import {Repository} from "typeorm";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
