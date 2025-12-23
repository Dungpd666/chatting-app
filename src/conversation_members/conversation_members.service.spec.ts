import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationMembersService } from './conversation_members.service';
import { ConversationMember } from './entities/conversation_member.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

describe('ConversationMembersService', () => {
  let service: ConversationMembersService;

  const mockConversationMemberRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockConversationRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationMembersService,
        {
          provide: getRepositoryToken(ConversationMember),
          useValue: mockConversationMemberRepository,
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepository,
        },
      ],
    }).compile();

    service = module.get<ConversationMembersService>(ConversationMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
