export class CreateConversationDto {
    type: 'direct' | 'group';
    name?: string;
    participant_id?: number;
    participant_ids?: number[];
}
