import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationMemberDto } from './create-conversation_member.dto';

export class UpdateConversationMemberDto extends PartialType(CreateConversationMemberDto) {}
