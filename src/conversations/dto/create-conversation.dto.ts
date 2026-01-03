export class CreateConversationDto {
    type: 'direct' | 'group' | 'private';
    name?: string;
    participant_id?: number;
    participant_ids?: number[];
    user_ids?: number[];
}
